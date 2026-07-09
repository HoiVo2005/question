'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AppHeader } from '@/components/layout/app-header';
import { PageLoading } from '@/components/layout/page-loading';
import {
  Plus,
  School,
  Users,
  DoorOpen,
  ChevronRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface Classroom {
  id: string;
  name: string;
  code: string;
  studentCount: number;
  roomCount: number;
}

export default function ClassroomsPage() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const res = await fetch('/api/teacher/classrooms');
      const data = await res.json();
      setClassrooms(data.classrooms || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Vui lòng nhập tên lớp');
      return;
    }
    setCreating(true);
    try {
      const res = await fetch('/api/teacher/classrooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Không tạo được lớp');
      setClassrooms((prev) => [data, ...prev]);
      setName('');
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <PageLoading />;

  return (
    <main className="min-h-screen app-bg">
      <AppHeader
        actions={
          <Button onClick={() => setShowForm((s) => !s)} size="sm">
            <Plus className="h-4 w-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Tạo lớp</span>
          </Button>
        }
      />

      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-soft">
            <School className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Lớp học</h1>
            <p className="text-sm text-muted-foreground">
              Tạo lớp, quản lý học sinh và mở bài thi
            </p>
          </div>
        </div>

        {/* Form tạo lớp */}
        {showForm && (
          <form
            onSubmit={handleCreate}
            className="mb-6 rounded-2xl border border-border/70 bg-card p-6 shadow-soft"
          >
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Tên lớp
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Lớp 10A1 - Toán"
                className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                autoFocus
              />
              <Button type="submit" disabled={creating}>
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Đang tạo...
                  </>
                ) : (
                  'Tạo lớp'
                )}
              </Button>
            </div>
            {error && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </form>
        )}

        {/* Danh sách lớp */}
        {classrooms.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center shadow-soft">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <School className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-semibold">Chưa có lớp nào</h3>
            <p className="mx-auto mt-1 mb-5 max-w-sm text-sm text-muted-foreground">
              Tạo lớp đầu tiên để bắt đầu thêm học sinh và mở bài thi.
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="mr-1.5 h-4 w-4" /> Tạo lớp
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {classrooms.map((c) => (
              <Link
                key={c.id}
                href={`/teacher/classrooms/${c.id}`}
                className="group rounded-2xl border border-border/70 bg-card p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-soft-lg"
              >
                <div className="flex items-start justify-between">
                  <h3 className="text-lg font-semibold">{c.name}</h3>
                  <ChevronRight className="h-5 w-5 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                </div>
                <div className="mt-4 flex gap-5 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="h-4 w-4" /> {c.studentCount} học sinh
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <DoorOpen className="h-4 w-4" /> {c.roomCount} bài thi
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
