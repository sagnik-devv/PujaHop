'use client';

import { insforge } from './insforge';
import { upsertLiveLocation, LiveLocation, HopMember } from './hop-room';
import { calculateDistance } from './geo';

export interface LocationWatcherCallbacks {
  onLocationUpdate?: (location: LiveLocation) => void;
  onMemberJoined?: (member: HopMember) => void;
  onSharingChanged?: (data: { userId: string; isSharing: boolean }) => void;
  onMeetupChanged?: (data: {
    pandalId: number | null;
    pandalName: string | null;
    latitude: number | null;
    longitude: number | null;
  }) => void;
  onConnectionChange?: (connected: boolean) => void;
  onError?: (errorMessage: string) => void;
  onSelfPosition?: (coords: { latitude: number; longitude: number; accuracy: number }) => void;
}

export class RealtimeLocationManager {
  private roomId: string;
  private currentUserId: string;
  private callbacks: LocationWatcherCallbacks;
  private watchId: number | null = null;
  private channelName: string;
  private lastSentLat: number | null = null;
  private lastSentLon: number | null = null;
  private lastSentTime = 0;
  private isSharing = true;
  private isSubscribed = false;
  private isDestroyed = false;

  constructor(roomId: string, currentUserId: string, callbacks: LocationWatcherCallbacks) {
    this.roomId = roomId;
    this.currentUserId = currentUserId;
    this.callbacks = callbacks;
    this.channelName = `room:${roomId}`;
  }

  /**
   * Initializes WebSocket subscription to room channel and starts GPS tracking
   */
  public async start(): Promise<void> {
    this.isDestroyed = false;

    // 1. Set up Realtime listener
    await this.setupRealtime();

    // 2. Start GPS watch
    this.startGeolocationWatch();
  }

  private async setupRealtime(): Promise<void> {
    try {
      if (!insforge.realtime.isConnected) {
        await insforge.realtime.connect();
      }

      // Channel subscription
      const res = await insforge.realtime.subscribe(this.channelName);
      if (res.ok) {
        this.isSubscribed = true;
        this.callbacks.onConnectionChange?.(true);
      }

      // Event Listeners
      insforge.realtime.on('location_update', this.handleRemoteLocationUpdate);
      insforge.realtime.on('sharing_changed', this.handleRemoteSharingChanged);
      insforge.realtime.on('member_joined', this.handleRemoteMemberJoined);
      insforge.realtime.on('meetup_changed', this.handleRemoteMeetupChanged);

      insforge.realtime.on('connect', () => {
        this.callbacks.onConnectionChange?.(true);
      });

      insforge.realtime.on('disconnect', () => {
        this.callbacks.onConnectionChange?.(false);
      });

      insforge.realtime.on('error', (err: any) => {
        console.warn('InsForge realtime error:', err);
      });
    } catch (err: any) {
      console.warn('Realtime connection error:', err);
      this.callbacks.onError?.('Could not connect to live room broadcast');
    }
  }

  private handleRemoteLocationUpdate = (msg: any) => {
    if (!msg || msg.room_id !== this.roomId) return;
    // Don't process self updates if received back
    if (msg.user_id === this.currentUserId) return;

    const loc: LiveLocation = {
      id: msg.id || `${msg.room_id}-${msg.user_id}`,
      room_id: msg.room_id,
      user_id: msg.user_id,
      latitude: msg.latitude,
      longitude: msg.longitude,
      accuracy: msg.accuracy ?? null,
      last_seen: msg.last_seen || new Date().toISOString(),
      is_sharing: msg.is_sharing ?? true,
      updated_at: msg.updated_at || new Date().toISOString(),
    };

    this.callbacks.onLocationUpdate?.(loc);
  };

  private handleRemoteSharingChanged = (msg: any) => {
    if (!msg || msg.room_id !== this.roomId) return;
    this.callbacks.onSharingChanged?.({
      userId: msg.user_id,
      isSharing: msg.is_sharing,
    });
  };

  private handleRemoteMemberJoined = (msg: any) => {
    if (!msg || msg.room_id !== this.roomId) return;
    this.callbacks.onMemberJoined?.(msg.member);
  };

  private handleRemoteMeetupChanged = (msg: any) => {
    if (!msg || msg.room_id !== this.roomId) return;
    this.callbacks.onMeetupChanged?.(msg.meetup);
  };

  private startGeolocationWatch(): void {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      this.callbacks.onError?.('Geolocation is not supported by your browser');
      return;
    }

    // Initial position fetch
    navigator.geolocation.getCurrentPosition(
      pos => this.processPosition(pos),
      err => this.handleGeoError(err),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 }
    );

    // Continuous watch
    this.watchId = navigator.geolocation.watchPosition(
      pos => this.processPosition(pos),
      err => this.handleGeoError(err),
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000,
      }
    );
  }

  private handleGeoError(err: GeolocationPositionError): void {
    if (this.isDestroyed) return;
    let msg = 'Unable to acquire location';
    if (err.code === err.PERMISSION_DENIED) {
      msg = 'Location permission denied. Please allow location access to share your position.';
    } else if (err.code === err.POSITION_UNAVAILABLE) {
      msg = 'GPS signal unavailable. Trying coarse location...';
    } else if (err.code === err.TIMEOUT) {
      msg = 'GPS signal timed out.';
    }
    this.callbacks.onError?.(msg);
  }

  private async processPosition(pos: GeolocationPosition): Promise<void> {
    if (this.isDestroyed || !this.isSharing) return;

    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;
    const accuracy = pos.coords.accuracy;

    this.callbacks.onSelfPosition?.({ latitude: lat, longitude: lon, accuracy });

    // Ignore positions with extremely poor accuracy (> 800m)
    if (accuracy > 800) {
      return;
    }

    const now = Date.now();
    const timeDelta = now - this.lastSentTime;

    let shouldSend = false;

    if (this.lastSentLat === null || this.lastSentLon === null) {
      shouldSend = true;
    } else {
      const movedMeters = calculateDistance(this.lastSentLat, this.lastSentLon, lat, lon) * 1000;
      // Send if moved >= 10 meters OR if >= 15 seconds elapsed
      if (movedMeters >= 10 || timeDelta >= 15000) {
        shouldSend = true;
      }
    }

    if (shouldSend) {
      this.lastSentLat = lat;
      this.lastSentLon = lon;
      this.lastSentTime = now;

      try {
        // 1. Update Database with explicit userId
        const { location } = await upsertLiveLocation({
          roomId: this.roomId,
          latitude: lat,
          longitude: lon,
          accuracy,
          isSharing: true,
          userId: this.currentUserId,
        });

        // 2. Broadcast via Realtime to Room Channel
        if (this.isSubscribed) {
          await insforge.realtime.publish(this.channelName, 'location_update', {
            room_id: this.roomId,
            user_id: this.currentUserId,
            latitude: lat,
            longitude: lon,
            accuracy,
            is_sharing: true,
            last_seen: new Date().toISOString(),
          });
        }

        if (location) {
          this.callbacks.onLocationUpdate?.(location);
        }
      } catch (e) {
        console.warn('Error sending location update:', e);
      }
    }
  }

  /**
   * Toggles sharing state
   */
  public async setSharing(isSharing: boolean): Promise<void> {
    this.isSharing = isSharing;

    if (this.isSubscribed) {
      await insforge.realtime.publish(this.channelName, 'sharing_changed', {
        room_id: this.roomId,
        user_id: this.currentUserId,
        is_sharing: isSharing,
      });
    }

    if (!isSharing && this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    } else if (isSharing && this.watchId === null) {
      this.startGeolocationWatch();
    }
  }

  /**
   * Broadcasts meetup change
   */
  public async broadcastMeetup(meetup: {
    pandalId: number | null;
    pandalName: string | null;
    latitude: number | null;
    longitude: number | null;
  }): Promise<void> {
    if (this.isSubscribed) {
      await insforge.realtime.publish(this.channelName, 'meetup_changed', {
        room_id: this.roomId,
        meetup,
      });
    }
  }

  /**
   * Broadcasts that current user has joined
   */
  public async broadcastMemberJoined(member: HopMember): Promise<void> {
    if (this.isSubscribed) {
      await insforge.realtime.publish(this.channelName, 'member_joined', {
        room_id: this.roomId,
        member,
      });
    }
  }

  /**
   * Stops tracking, unsubscribes and removes event handlers
   */
  public stop(): void {
    this.isDestroyed = true;

    if (this.watchId !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    insforge.realtime.off('location_update', this.handleRemoteLocationUpdate);
    insforge.realtime.off('sharing_changed', this.handleRemoteSharingChanged);
    insforge.realtime.off('member_joined', this.handleRemoteMemberJoined);
    insforge.realtime.off('meetup_changed', this.handleRemoteMeetupChanged);

    if (this.isSubscribed) {
      insforge.realtime.unsubscribe(this.channelName);
      this.isSubscribed = false;
    }
  }
}
