'use client';
import SideDrawer from '@/components/SideDrawer';
import { Button } from '@/components/ui/button';
import { globalContext } from '@/context/globalContext';
import Image from 'next/image';
import Link from 'next/link';
import { useContext, useState } from 'react';
import logo from '../../assets/logo.png';

function LibraryHeader() {
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const { dbUser } = useContext(globalContext);

  const toggleDrawer = () => {
    setDrawerOpen(!isDrawerOpen);
  };

  const handlePicClick = event => {
    setAnchorEl(event.currentTarget);
    navigator.clipboard.writeText(window.location.href);
  };

  return (
    <header className='sticky top-0 z-50 w-full border-b border-gray-200/60 bg-white/95 backdrop-blur-sm shadow-sm'>
      <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex h-16 items-center justify-between'>
          {/* Left side - Heading */}
          <div className='flex items-center'>
            <p className='text-sm sm:text-base font-medium text-gray-700 hidden sm:block'>
              Click on a board below to add to your Boardzy!
            </p>
            <p className='text-xs font-medium text-gray-700 sm:hidden'>Select a board</p>
          </div>

          {/* Right side - Logo, Menu, Auth */}
          <div className='flex items-center gap-3 sm:gap-4'>
            <Link href='/dashboard' prefetch={false} className='flex items-center'>
              <Image src={logo} alt='Boardzy logo' priority className='h-8 w-auto sm:h-10' />
            </Link>

            {/* Menu Button */}
            <button
              onClick={toggleDrawer}
              className='inline-flex items-center justify-center rounded-lg p-2 text-[#63899e] hover:bg-gray-100/80 focus:outline-none focus:ring-2 focus:ring-[#63899e] focus:ring-offset-2 transition-all duration-200 border-0 outline-none'
              aria-label='Open menu'
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
                <path d='M4 6h16M4 12h16M4 18h16' />
              </svg>
            </button>

            {/* User Menu or Auth Buttons */}
            {dbUser ? (
              <div className='relative'>
                <button
                  onClick={handlePicClick}
                  className='flex items-center focus:outline-none focus:ring-2 focus:ring-[#63899e] focus:ring-offset-2 rounded-full border-0 outline-none transition-all duration-200 hover:ring-2 hover:ring-[#63899e]/30'
                >
                  <img
                    src={dbUser.picture}
                    alt={dbUser.email}
                    className='h-8 w-8 sm:h-10 sm:w-10 rounded-full border-2 border-gray-200 hover:border-[#63899e] transition-all duration-200 shadow-sm hover:shadow-md'
                  />
                </button>

                {/* Dropdown Menu */}
                {anchorEl && (
                  <>
                    <div className='fixed inset-0 z-40' onClick={() => setAnchorEl(null)} />
                    <div className='absolute right-0 mt-2 w-64 rounded-xl shadow-xl bg-white/95 backdrop-blur-sm border border-gray-200/60 z-50 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200'>
                      {/* User Info Section */}
                      <div className='px-4 py-4 bg-gradient-to-r from-[#63899e]/5 to-[#4a6d7e]/5 border-b border-gray-200/60'>
                        <div className='flex items-center gap-3'>
                          <img
                            src={dbUser.picture}
                            alt={dbUser.email}
                            className='h-10 w-10 rounded-full border-2 border-[#63899e]/20'
                          />
                          <div className='flex-1 min-w-0'>
                            <p className='text-sm font-semibold text-gray-900 truncate'>
                              {dbUser.name || 'User'}
                            </p>
                            <p className='text-xs text-gray-500 truncate mt-0.5'>{dbUser.email}</p>
                          </div>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className='h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent' />

                      {/* Menu Items */}
                      <div>
                        <a
                          href='/api/auth/logout'
                          className='flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-50/50 transition-all duration-200 group'
                        >
                          <svg
                            className='h-4 w-4 text-gray-400 group-hover:text-red-500 transition-colors'
                            fill='none'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth='2'
                            viewBox='0 0 24 24'
                            stroke='currentColor'
                          >
                            <path d='M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1' />
                          </svg>
                          <span className='group-hover:text-red-600 font-medium transition-colors'>
                            Log out
                          </span>
                        </a>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className='flex items-center gap-2'>
                <a href='/api/auth/login?screen_hint=signup'>
                  <Button variant='default' size='sm' className='hidden sm:inline-flex'>
                    Sign up
                  </Button>
                </a>
                <a href='/api/auth/login'>
                  <Button variant='outline' size='sm' className='hidden sm:inline-flex'>
                    Login
                  </Button>
                </a>
                {/* Mobile auth buttons */}
                <a href='/api/auth/login?screen_hint=signup' className='sm:hidden'>
                  <Button variant='default' size='sm'>
                    Sign up
                  </Button>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
      <SideDrawer open={isDrawerOpen} close={toggleDrawer} user={dbUser} />
    </header>
  );
}

export default LibraryHeader;
