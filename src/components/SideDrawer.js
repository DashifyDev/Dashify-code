'use client';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

function SideDrawer({ open, close, user, isMobile, authUser }) {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  // Handle mount/unmount for animations
  useEffect(() => {
    if (open) {
      setIsMounted(true);
    } else {
      // Delay unmount to allow close animation
      const timer = setTimeout(() => setIsMounted(false), 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Block body scroll when drawer is open
  useEffect(() => {
    if (open) {
      // Save current overflow values
      const originalOverflow = document.body.style.overflow;
      const originalOverflowX = document.body.style.overflowX;

      // Also block on html element
      document.documentElement.style.overflow = 'hidden';
      document.documentElement.style.overflowX = 'hidden';

      return () => {
        // Restore original overflow values
        document.body.style.overflow = originalOverflow;
        document.body.style.overflowX = originalOverflowX;
        document.documentElement.style.overflow = '';
        document.documentElement.style.overflowX = '';
      };
    }
  }, [open]);

  const redirectToHomepage = () => {
    router.push(`https://home.boardzy.app/`);
    close();
  };

  const redirectToLibrary = () => {
    router.push(`/library`);
    close();
  };

  const redirectToLife = () => {
    window.open('https://dashboardyourlife.com/', '_blank', 'noopener,noreferrer');
    close();
  };

  const redirectToHowToUse = () => {
    router.push('/how-to-use');
    close();
  };

  const menuItems = [
    {
      title: 'Homepage',
      description: 'What is Boardzy & How to use it!',
      icon: (
        <svg
          className='h-5 w-5'
          fill='none'
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth='2'
          viewBox='0 0 24 24'
          stroke='currentColor'
        >
          <path d='M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' />
        </svg>
      ),
      onClick: redirectToHomepage
    },
    {
      title: 'Boards Library',
      description: 'Quick-start templates',
      icon: (
        <svg
          className='h-5 w-5'
          fill='none'
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth='2'
          viewBox='0 0 24 24'
          stroke='currentColor'
        >
          <path d='M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' />
        </svg>
      ),
      onClick: redirectToLibrary
    },
    {
      title: 'How to Use Boardzy',
      description: 'Watch video tutorial',
      icon: (
        <svg
          className='h-5 w-5'
          fill='none'
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth='2'
          viewBox='0 0 24 24'
          stroke='currentColor'
        >
          <path d='M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z' />
          <path d='M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
        </svg>
      ),
      onClick: redirectToHowToUse
    },
    {
      title: 'Dashboard Your Life',
      description: 'Get help creating your boards',
      icon: (
        <svg
          className='h-5 w-5'
          fill='none'
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth='2'
          viewBox='0 0 24 24'
          stroke='currentColor'
        >
          <path d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' />
        </svg>
      ),
      onClick: redirectToLife
    }
  ];

  // Don't render if not mounted (prevents any layout issues)
  if (!isMounted) return null;

  const drawerContent = (
    <>
      {/* Backdrop */}
      <div
        className={`fixed top-0 left-0 right-0 bottom-0 w-screen h-screen bg-black/50 backdrop-blur-sm z-[9998] transition-all duration-300 ease-in-out ${
          open ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
        }`}
        onClick={close}
        style={{ overflow: 'hidden' }}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-[100dvh] w-80 sm:w-96 bg-gradient-to-br from-[#63899e] via-[#5a7a8d] to-[#4a6d7e] shadow-2xl z-[9999] transform transition-transform duration-300 ease-in-out flex flex-col ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ overflow: 'hidden', maxHeight: '100dvh' }}
      >
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-white/20 bg-white/5 backdrop-blur-sm flex-shrink-0'>
          <h2 className='text-xl font-bold text-white'>Menu</h2>
          <button
            onClick={close}
            className='p-2 rounded-lg text-white hover:bg-white/20 hover:text-white transition-all duration-200 border-0 outline-none bg-transparent'
            aria-label='Close menu'
          >
            <svg
              className='h-6 w-6'
              fill='none'
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2.5'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path d='M6 18L18 6M6 6l12 12' />
            </svg>
          </button>
        </div>

        {/* Menu Items - Scrollable */}
        <div className='flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-2 min-h-0'>
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={item.onClick}
              className='group w-full flex flex-col gap-0 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-200 text-left hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]'
            >
              <div className='flex items-center gap-3'>
                <div className='text-white/80 group-hover:text-white transition-colors flex-shrink-0'>
                  {item.icon}
                </div>
                <h3 className='text-lg font-semibold text-white group-hover:text-white/95 leading-tight m-0'>
                  {item.title}
                </h3>
              </div>
              <p className='text-sm text-white/70 group-hover:text-white/80 pl-8 transition-colors leading-tight m-0'>
                {item.description}
              </p>
            </button>
          ))}
        </div>

        {/* Auth Buttons for Mobile - Fixed at bottom */}
        {isMobile && !authUser && (
          <div className='flex-shrink-0 border-t border-white/10 mt-auto'>
            <div className='h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mx-4 my-4' />
            <div className='px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] space-y-3'>
              <Link
                href='/api/auth/login?screen_hint=signup'
                prefetch={false}
                onClick={close}
                className='block'
              >
                <Button
                  variant='default'
                  className='w-full !bg-white !text-[#63899e] hover:!bg-white/90 shadow-lg hover:shadow-xl transition-all duration-200 font-semibold !border-0'
                >
                  Sign up
                </Button>
              </Link>
              <Link href='/api/auth/login' prefetch={false} onClick={close} className='block'>
                <Button
                  variant='outline'
                  className='w-full border-2 border-white/30 !text-white hover:bg-white/10 hover:border-white/50 transition-all duration-200 font-semibold'
                >
                  Login
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );

  // Render to portal (body) to avoid layout issues
  if (typeof window !== 'undefined') {
    return createPortal(drawerContent, document.body);
  }

  return null;
}

export default SideDrawer;
