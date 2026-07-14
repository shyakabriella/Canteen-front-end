export default function AdminFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white px-4 py-5 sm:px-6">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col items-center justify-between gap-2 text-center text-xs text-slate-500 sm:flex-row sm:text-left">
        <p>
          © {new Date().getFullYear()} Smart Canteen Management System.
        </p>

        <p>
          Ordering, wallet, QR verification and inventory management.
        </p>
      </div>
    </footer>
  )
}
