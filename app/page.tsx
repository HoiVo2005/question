'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/layout/logo';
import { PageLoading } from '@/components/layout/page-loading';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  Bot,
  Users,
  PenLine,
  Clock,
  BarChart3,
  CheckCircle2,
  FileDown,
  ShieldCheck,
} from 'lucide-react';

export default function Page() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!isPending && session?.user) {
      const role = (session.user as { role?: string }).role;
      router.push(role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard');
    }
  }, [session, isPending, router]);

  if (isPending || session?.user) {
    return <PageLoading />;
  }

  return (
    <main className="min-h-screen app-bg">
      {/* Nav */}
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5">
        <Logo />
        <div className="flex gap-2 sm:gap-3">
          <Button asChild variant="ghost">
            <Link href="/signin">Đăng nhập</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Đăng ký</Link>
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 pt-10 pb-20 text-center animate-in-up">
        <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
          <Sparkles className="h-4 w-4" />
          Tạo đề thi bằng AI · Chuẩn Bộ GD&ĐT
        </div>
        <h1 className="mx-auto max-w-4xl text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-6xl">
          Tạo đề, làm bài và chấm thi{' '}
          <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            trực tuyến
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Nền tảng trọn gói giúp giáo viên ra đề (kể cả bằng AI), học sinh làm bài và hệ
          thống chấm điểm tự động — tiết kiệm thời gian, chính xác và đẹp mắt.
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="h-12 px-7 text-base">
            <Link href="/signup">
              Bắt đầu ngay <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-12 px-7 text-base">
            <Link href="/signin">Tôi đã có tài khoản</Link>
          </Button>
        </div>

        {/* Điểm nổi bật nhanh */}
        <div className="mx-auto mt-10 flex max-w-3xl flex-wrap items-center justify-center gap-x-7 gap-y-2 text-sm text-muted-foreground">
          {['Lớp 1 đến 12', 'Trắc nghiệm & tự luận', 'Xuất Word / PDF', 'Chấm tự động'].map(
            (t) => (
              <span key={t} className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> {t}
              </span>
            )
          )}
        </div>
      </section>

      {/* Tính năng */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="grid gap-6 md:grid-cols-3">
          <FeatureCard
            icon={<PenLine className="h-6 w-6" />}
            color="from-indigo-500 to-violet-600"
            title="Dành cho giáo viên"
            items={[
              'Tạo đề thủ công hoặc tải lên',
              'Sinh đề tự động bằng AI',
              'Hỗ trợ trắc nghiệm & tự luận',
              'Chấm tự động và chấm tay',
              'Thống kê kết quả chi tiết',
            ]}
          />
          <FeatureCard
            icon={<Users className="h-6 w-6" />}
            color="from-sky-500 to-cyan-500"
            title="Dành cho học sinh"
            items={[
              'Vào thi bằng mã đề',
              'Đồng hồ đếm ngược thời gian',
              'Nhiều dạng câu hỏi',
              'Nộp ảnh cho câu tự luận',
              'Tự động lưu bài làm',
            ]}
          />
          <FeatureCard
            icon={<Bot className="h-6 w-6" />}
            color="from-fuchsia-500 to-pink-500"
            title="Sức mạnh AI"
            items={[
              'Sinh đề theo lớp & chương',
              'Phân bổ mức độ chuẩn Bộ GD',
              'Đáp án & lời giải chi tiết',
              'Nhiều mã đề khác nhau',
              'Xuất file đề và đáp án',
            ]}
          />
        </div>
      </section>

      {/* Dải CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-600 px-8 py-12 text-center text-white shadow-soft-lg">
          <h2 className="text-2xl font-bold sm:text-3xl">
            Sẵn sàng tạo đề thi đầu tiên của bạn?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-white/85">
            Đăng ký miễn phí và tạo đề thi chuẩn chỉ trong vài phút.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-6 text-sm text-white/90">
            <span className="inline-flex items-center gap-2">
              <Clock className="h-4 w-4" /> Nhanh chóng
            </span>
            <span className="inline-flex items-center gap-2">
              <FileDown className="h-4 w-4" /> Xuất Word / PDF
            </span>
            <span className="inline-flex items-center gap-2">
              <BarChart3 className="h-4 w-4" /> Thống kê
            </span>
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" /> An toàn
            </span>
          </div>
          <Button
            asChild
            size="lg"
            className="mt-8 h-12 bg-white px-8 text-base text-indigo-700 hover:bg-white/90"
          >
            <Link href="/signup">
              Đăng ký miễn phí <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border/60 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 sm:flex-row">
          <Logo />
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} ExamHub · Nền tảng thi trực tuyến
          </p>
        </div>
      </footer>
    </main>
  );
}

function FeatureCard({
  icon,
  color,
  title,
  items,
}: {
  icon: React.ReactNode;
  color: string;
  title: string;
  items: string[];
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-7 shadow-soft transition hover:-translate-y-1 hover:shadow-soft-lg">
      <div
        className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${color} text-white shadow-soft`}
      >
        {icon}
      </div>
      <h3 className="mb-4 text-lg font-bold">{title}</h3>
      <ul className="space-y-2.5 text-sm text-muted-foreground">
        {items.map((it) => (
          <li key={it} className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}