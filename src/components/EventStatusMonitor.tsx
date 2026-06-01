"use client";

import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { toast } from "sonner";

interface EventStatusMonitorProps {
    eventoId?: string;
    artistId: string;
    currentStatus: boolean;
}

export function EventStatusMonitor({ eventoId, artistId, currentStatus }: EventStatusMonitorProps) {
    const statusRef = useRef(currentStatus);

    // Update ref when prop changes, without re-triggering useEffect
    useEffect(() => {
        statusRef.current = currentStatus;
    }, [currentStatus]);

    useEffect(() => {
        if (!artistId) {
            console.warn("EventStatusMonitor: missing artistId");
            return;
        }

        const socketUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
        console.log(`EventStatusMonitor: Connecting to ${socketUrl} for artist ${artistId}`);

        const socket = io(socketUrl, {
            reconnectionAttempts: 10,
            timeout: 5000,
            transports: ['websocket', 'polling']
        });

        let reloadTimeout: NodeJS.Timeout | null = null;

        const handleReload = () => {
            if (reloadTimeout) return; // Already scheduled

            console.log("Socket: Action required. Reloading page in 1.5s...");
            reloadTimeout = setTimeout(() => {
                globalThis.location.reload();
            }, 1500);
        };

        socket.on("connect", () => {
            console.log(`Socket connected! ID: ${socket.id}. Joining artist:${artistId}`);
            socket.emit("join_artist", artistId);
            if (eventoId) {
                console.log(`Joining event room: event:${eventoId}`);
                socket.emit("join_event", eventoId);
            }
        });

        socket.on("connect_error", (error) => {
            console.error("Socket connection error:", error);
        });

        socket.on("pedidos_status", (data: { activo: boolean }) => {
            console.log("Socket: pedidos_status received", data, "Current status ref:", statusRef.current);
            if (data.activo !== statusRef.current) {
                if (data.activo) {
                    toast.success("¡El artista ya puede recibir pedidos!");
                } else {
                    toast.warning("El artista ya no recibe pedidos.");
                }
                handleReload();
            }
        });

        socket.on("event_started", (data: { eventId: string }) => {
            console.log("Socket: event_started received", data);
            // We don't toast here because pedidos_status will toast "Ya puede recibir pedidos"
            handleReload();
        });

        socket.on("event_ended", (data: { eventId: string }) => {
            console.log("Socket: event_ended received", data);
            // We don't toast here because pedidos_status will toast "Ya no recibe pedidos"
            handleReload();
        });

        return () => {
            console.log("EventStatusMonitor: Cleaning up socket");
            if (reloadTimeout) {
                clearTimeout(reloadTimeout);
            }
            socket.disconnect();
        };
    }, [eventoId, artistId]); // Only reconnect if IDs change, not the status itself

    return null; // Headless component
}
