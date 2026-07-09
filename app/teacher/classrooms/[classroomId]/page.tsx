'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AppHeader } from '@/components/layout/app-header';
import { PageLoading } from '@/components/layout/page-loading';
import { formatDateVi } from '@/lib/format';
import { confirmDelete, toast, notify } from '@/lib/swal';
import {
  ArrowLeft,
  School,
  Users,
  DoorOpen,
  Copy,
  Plus,
  Loader2,
  AlertCircle,
  Sparkles,
  Clock,
  CheckCircle2,
  UserPlus,
  Trash2,
  Pencil,
  FileUp,
  KeyRound,
} from 'lucide-react';

interface Student {
  id: string;
  name: string;
  email: string;
  joinedAt: string;
}
interface Room {
  id: string;
  name: string;
  roomCode: string;
  examSetIds: string[];
  examSetCount: number;
  startTime: string | null;
  endTime: string | null;
  status: 'upcoming' | 'open' | 'closed';
}
interface Detail {
  id: string;
  name: string;
  code: string;
  students: Student[];
  rooms: Room[];
}
interface ExamSet {
  id: string;
  name: string;
  setCode: string;
  subject: string;
  grade: number;
  questionCount: number;
}

const ROOM_STATUS = {
  open: { label: 'Đang mở', cls: 'bg-emerald-100 text-emerald-700' },
  upcoming: { label: 'Sắp diễn ra', cls: 'bg-sky-100 text-sky-700' },
  closed: { label: 'Đã đóng', cls: 'bg-muted text-muted-foreground' },
} as const;

function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export default function ClassroomDetailPage() {
  const params = useParams();
  const classroomId = params.classroomId as string;

  const [detail, setDetail] = useState<Detail | null>(null);
  const [bank, setBank] = useState<ExamSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // form bài thi (dùng cho cả tạo & sửa)
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [roomName, setRoomName] = useState('');
  const [selectedSets, setSelectedSets] = useState<string[]>([]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  // thêm học sinh
  const [studentEmail, setStudentEmail] = useState('');
  const [addingStudent, setAddingStudent] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (classroomId) load();
  }, [classroomId]);

  const load = async () => {
    try {
      const [dRes, bRes] = await Promise.all([
        fetch(`/api/teacher/classrooms/${classroomId}`),
        fetch('/api/teacher/exam-bank'),
      ]);
      if (dRes.ok) setDetail(await dRes.json());
      if (bRes.ok) {
        const b = await bRes.json();
        setBank(b.examSets || []);
      }
    } finally {
      setLoading(false);
    }
  };

  // ---- Bài thi ----
  const resetRoomForm = () => {
    setEditingRoomId(null);
    setRoomName('');
    setSelectedSets([]);
    setStartTime('');
    setEndTime('');
    setError('');
  };

  const openCreate = () => {
    resetRoomForm();
    setShowForm(true);
  };

  const openEdit = (r: Room) => {
    setEditingRoomId(r.id);
    setRoomName(r.name || '');
    setSelectedSets(r.examSetIds || []);
    setStartTime(toLocalInput(r.startTime));
    setEndTime(toLocalInput(r.endTime));
    setError('');
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleSet = (id: string) =>
    setSelectedSets((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const handleSubmitRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (selectedSets.length === 0) {
      setError('Vui lòng chọn ít nhất một mã đề');
      return;
    }
    setCreating(true);
    try {
      const url = editingRoomId
        ? `/api/teacher/classrooms/${classroomId}/rooms/${editingRoomId}`
        : `/api/teacher/classrooms/${classroomId}/rooms`;
      const res = await fetch(url, {
        method: editingRoomId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: roomName || 'Bài thi',
          examSetIds: selectedSets,
          startTime: startTime || null,
          endTime: endTime || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Không lưu được bài thi');
      setShowForm(false);
      resetRoomForm();
      await toast(editingRoomId ? 'Đã cập nhật bài thi' : 'Đã tạo bài thi');
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setCreating(false);
    }
  };

  const deleteRoom = async (r: Room) => {
    const ok = await confirmDelete({
      title: 'Xoá bài thi?',
      text: `Phòng "${r.name}" (mã ${r.roomCode}) sẽ bị xoá.`,
    });
    if (!ok) return;
    await fetch(`/api/teacher/classrooms/${classroomId}/rooms/${r.id}`, {
      method: 'DELETE',
    });
    await toast('Đã xoá bài thi');
    load();
  };

  // ---- Học sinh ----
  const addStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentEmail.trim()) return;
    setAddingStudent(true);
    try {
      const res = await fetch(`/api/teacher/classrooms/${classroomId}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: studentEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Không thêm được học sinh');
      setStudentEmail('');
      await toast('Đã thêm học sinh vào lớp');
      load();
    } catch (err) {
      await notify(err instanceof Error ? err.message : String(err), 'warning');
    } finally {
      setAddingStudent(false);
    }
  };

  const removeStudent = async (studentId: string) => {
    const ok = await confirmDelete({
      title: 'Xoá học sinh khỏi lớp?',
      text: 'Học sinh sẽ không còn trong lớp này.',
    });
    if (!ok) return;
    await fetch(
      `/api/teacher/classrooms/${classroomId}/students?studentId=${studentId}`,
      { method: 'DELETE' }
    );
    await toast('Đã xoá học sinh khỏi lớp');
    load();
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const XLSX = await import('xlsx');
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf);
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      const emails: string[] = [];
      for (const row of rows) {
        for (const cell of row) {
          const v = String(cell ?? '').trim();
          if (v.includes('@') && v.includes('.')) emails.push(v);
        }
      }
      if (emails.length === 0) {
        throw new Error('Không tìm thấy email nào trong file Excel.');
      }
      const res = await fetch(
        `/api/teacher/classrooms/${classroomId}/import-students`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emails }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Nhập danh sách thất bại');
      await notify(
        `Đã thêm ${data.imported}/${data.total} học sinh.` +
          (data.failed?.length
            ? ` Các email chưa đăng ký tài khoản: ${data.failed.join(', ')}`
            : ''),
        data.failed?.length ? 'warning' : 'success'
      );
      load();
    } catch (err) {
      await notify(err instanceof Error ? err.message : String(err), 'error');
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  if (loading) return <PageLoading />;
  if (!detail)
    return (
      <div className="app-bg min-h-screen">
        <AppHeader />
        <p className="p-12 text-center text-muted-foreground">Không tìm thấy lớp.</p>
      </div>
    );

  const inputCls =
    'w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40';
  const labelCls = 'mb-1.5 block text-sm font-medium text-foreground';

  return (
    <main className="min-h-screen app-bg">
      <AppHeader
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/teacher/classrooms">
              <ArrowLeft className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Lớp học</span>
            </Link>
          </Button>
        }
      />

      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Thông tin lớp */}
        <div className="mb-6 rounded-2xl border border-border/70 bg-card p-6 shadow-soft">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-soft">
              <School className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{detail.name}</h1>
              <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Users className="h-4 w-4" /> {detail.students.length} học sinh
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bài thi */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <DoorOpen className="h-5 w-5 text-primary" /> Bài thi
          </h2>
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-1.5 h-4 w-4" /> Tạo bài thi
          </Button>
        </div>

        {/* Form tạo/sửa bài thi */}
        {showForm && (
          <form
            onSubmit={handleSubmitRoom}
            className="mb-6 space-y-4 rounded-2xl border border-border/70 bg-card p-6 shadow-soft"
          >
            <h3 className="font-semibold">
              {editingRoomId ? 'Sửa bài thi' : 'Tạo bài thi mới'}
            </h3>
            <div>
              <label className={labelCls}>Tên bài thi</label>
              <input
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="VD: Kiểm tra giữa kỳ - Đợt 1"
                className={inputCls}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={`${labelCls} flex items-center gap-1.5`}>
                  <Clock className="h-4 w-4" /> Bắt đầu (tuỳ chọn)
                </label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={`${labelCls} flex items-center gap-1.5`}>
                  <Clock className="h-4 w-4" /> Kết thúc (tuỳ chọn)
                </label>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>
                Chọn mã đề (đề sẽ được gán ngẫu nhiên cho từng học sinh)
              </label>
              {bank.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                  Chưa có mã đề nào. Hãy{' '}
                  <Link
                    href="/teacher/generate-exam"
                    className="font-medium text-primary hover:underline"
                  >
                    tạo đề bằng AI
                  </Link>{' '}
                  trước.
                </div>
              ) : (
                <div className="grid max-h-60 gap-2 overflow-y-auto sm:grid-cols-2">
                  {bank.map((s) => {
                    const active = selectedSets.includes(s.id);
                    return (
                      <button
                        type="button"
                        key={s.id}
                        onClick={() => toggleSet(s.id)}
                        className={`flex items-center gap-3 rounded-lg border p-3 text-left transition ${
                          active
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/40'
                        }`}
                      >
                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded border ${
                            active
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-border'
                          }`}
                        >
                          {active && <CheckCircle2 className="h-4 w-4" />}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">
                            {s.name || `Mã đề ${s.setCode}`}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            {s.subject} · Lớp {s.grade} · {s.questionCount} câu · Mã{' '}
                            {s.setCode}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  resetRoomForm();
                }}
              >
                Huỷ
              </Button>
              <Button type="submit" disabled={creating || bank.length === 0}>
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Đang lưu...
                  </>
                ) : editingRoomId ? (
                  'Lưu thay đổi'
                ) : (
                  'Tạo bài thi'
                )}
              </Button>
            </div>
          </form>
        )}

        {detail.rooms.length === 0 ? (
          <div className="mb-8 rounded-2xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground shadow-soft">
            Chưa có bài thi nào. Tạo bài thi và chọn mã đề để học sinh vào thi.
          </div>
        ) : (
          <div className="mb-8 grid gap-3">
            {detail.rooms.map((r) => {
              const st = ROOM_STATUS[r.status];
              return (
                <div
                  key={r.id}
                  className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h3 className="font-semibold">{r.name}</h3>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${st.cls}`}
                        >
                          {st.label}
                        </span>
                      </div>

                      {/* Mã bài thi */}
                      <div className="mt-2 flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Mã bài thi:</span>
                        <code className="rounded-md bg-primary/10 px-2.5 py-1 font-mono text-base font-bold tracking-wider text-primary">
                          {r.roomCode}
                        </code>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard?.writeText(r.roomCode);
                            toast('Đã sao chép mã bài thi');
                          }}
                          className="text-muted-foreground transition hover:text-primary"
                          title="Sao chép mã bài thi"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5" /> {r.examSetCount} mã đề
                          (ngẫu nhiên)
                        </span>
                        {r.startTime && <span>Mở: {formatDateVi(r.startTime)}</span>}
                        {r.endTime && <span>Đóng: {formatDateVi(r.endTime)}</span>}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/teacher/room/${r.id}`}>
                          <Users className="mr-1 h-3.5 w-3.5" /> Kết quả
                        </Link>
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openEdit(r)}>
                        <Pencil className="mr-1 h-3.5 w-3.5" /> Sửa
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => deleteRoom(r)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Học sinh */}
        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
          <Users className="h-5 w-5 text-primary" /> Học sinh trong lớp (
          {detail.students.length})
        </h2>

        {/* Thêm học sinh: thủ công + Excel */}
        <div className="mb-4 rounded-2xl border border-border/70 bg-card p-4 shadow-soft">
          <form onSubmit={addStudent} className="space-y-2">
            <label className={labelCls}>Thêm học sinh (theo email đã đăng ký)</label>
            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <input
                type="email"
                value={studentEmail}
                onChange={(e) => setStudentEmail(e.target.value)}
                placeholder="email-hoc-sinh@example.com"
                className={inputCls}
              />
              <Button type="submit" disabled={addingStudent}>
                {addingStudent ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="mr-1.5 h-4 w-4" /> Thêm
                  </>
                )}
              </Button>
            </div>
          </form>

          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleImportFile}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={importing}
              onClick={() => fileRef.current?.click()}
            >
              {importing ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Đang nhập...
                </>
              ) : (
                <>
                  <FileUp className="mr-1.5 h-4 w-4" /> Nhập từ Excel (email)
                </>
              )}
            </Button>
            <span className="text-xs text-muted-foreground">
              File Excel chứa cột email của học sinh đã đăng ký. Chỉ học sinh trong lớp
              mới vào được bài thi.
            </span>
          </div>
        </div>

        {detail.students.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground shadow-soft">
            Chưa có học sinh nào. Thêm thủ công hoặc nhập từ Excel ở trên.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft">
            <div className="flex items-center gap-3 border-b border-border/60 bg-muted/40 px-5 py-2 text-xs font-semibold uppercase text-muted-foreground">
              <span className="w-8 text-center">STT</span>
              <span className="flex-1">Học sinh</span>
              <span>Thao tác</span>
            </div>
            {detail.students.map((s, i) => (
              <div
                key={s.id}
                className="flex items-center gap-3 border-t border-border/60 px-5 py-3 first:border-t-0"
              >
                <span className="w-8 text-center text-sm font-semibold text-muted-foreground">
                  {i + 1}
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-semibold text-white">
                  {(s.name || '?').charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{s.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{s.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeStudent(s.id)}
                  className="text-muted-foreground transition hover:text-destructive"
                  title="Xoá khỏi lớp"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
