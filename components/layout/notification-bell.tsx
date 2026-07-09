'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck } from 'lucide-react';
import { formatDateVi } from '@/lib/format';

interface Noti {
  id: string;
  title: string;
  body?: string;
  type?: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

const ICON: Record<string, string> = {
  class: '🏫',
  submit: '📝',
  account: '🔒',
  exam: '⏰',
  success: '✅',
  info: '🔔',
};

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Noti[]>([]);
  const [unread, setUnread] = useState(0);
  const [visible, setVisible] = useState(5);
  const ref = useRef<HTMLDivElement>(null);

  const load = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setItems(data.notifications || []);
        setUnread(data.unread || 0);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  // Đóng khi bấm ra ngoài
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next) setVisible(5);
    if (next && unread > 0) {
      setUnread(0);
      setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
      try {
        await fetch('/api/notifications/read', { method: 'POST' });
      } catch {
        // ignore
      }
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggle}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
        title="Thông báo"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-2 top-[4.25rem] z-50 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft-lg sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-80">
          <div className="flex items-center justify-between border-b border-border/60 px-4 py-2.5">
            <span className="text-sm font-semibold">Thông báo</span>
            <CheckCheck className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                Chưa có thông báo nào
              </p>
            ) : (
              items.slice(0, visible).map((n) => (
                <button
                  key={n.id}
                  onClick={() => {
                    setOpen(false);
                    if (n.link) router.push(n.link);
                  }}
                  className={`flex w-full gap-3 border-b border-border/50 px-4 py-3 text-left transition hover:bg-muted/50 ${
                    n.is_read ? '' : 'bg-primary/5'
                  }`}
                >
                  <span className="text-lg leading-none">
                    {ICON[n.type || 'info'] || '🔔'}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{n.title}</span>
                    {n.body && (
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {n.body}
                      </span>
                    )}
                    <span className="mt-1 block text-[11px] text-muted-foreground">
                      {formatDateVi(n.created_at)}
                    </span>
                  </span>
                  {!n.is_read && (
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  )}
                </button>
              ))
            )}

            {items.length > visible && (
              <button
                onClick={() => setVisible((v) => v + 5)}
                className="w-full bg-card py-2.5 text-center text-sm font-medium text-primary transition hover:bg-muted/50"
              >
                Xem thêm ({items.length - visible})
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
