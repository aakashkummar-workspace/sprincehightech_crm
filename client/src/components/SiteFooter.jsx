// Fixed attribution bar — stays pinned to the bottom of the viewport on
// every screen (Login included, since it renders outside Layout's routes)
// rather than scrolling away at the end of individual pages.
export default function SiteFooter() {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center">
      <div className="pointer-events-auto w-full bg-gradient-to-r from-transparent via-white/40 to-transparent px-4 py-1.5 text-center text-xs text-gray-400 backdrop-blur-sm dark:via-black/30 dark:text-gray-500">
        Developed by{' '}
        <a
          href="https://sirahdigital.in/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
        >
          SIRAH DIGITAL
        </a>
      </div>
    </div>
  );
}
