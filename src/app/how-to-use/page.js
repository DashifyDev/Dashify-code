'use client';
import './how-to-use.css';
import Link from 'next/link';

function HowToUseBoardzy() {
  return (
    <div className='how-to-use-page'>
      {/* Hero Section */}
      <section className='how-to-use-hero'>
        <h1>How to Use Boardzy</h1>
        <p className='how-to-use-subtitle'>
          Learn how to create beautiful, organized boards in minutes
        </p>
      </section>

      {/* Video Section */}
      <section className='how-to-use-video-section'>
        <div className='how-to-use-content'>
          <h2>Getting Started with Boardzy</h2>
          <p>
            Watch this quick tutorial to learn everything you need to know about creating
            and customizing your boards. From adding tiles to organizing your content,
            we'll guide you through all the essential features.
          </p>
          <p>
            Whether you're creating a vision board, organizing projects, or planning your goals,
            Boardzy makes it easy to bring your ideas to life!
          </p>
        </div>

        <div className='how-to-use-video-container'>
          <iframe
            src='https://www.youtube.com/embed/R8Eux2s91Fw'
            title='How to Use Boardzy - Tutorial Video'
            frameBorder='0'
            allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
            allowFullScreen
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className='how-to-use-cta'>
        <h2>Ready to Create Your First Board?</h2>
        <div className='how-to-use-cta-buttons'>
          <Link href='/dashboard' className='cta-button primary'>
            Start Creating
          </Link>
          <Link href='/library' className='cta-button secondary'>
            Browse Templates
          </Link>
        </div>
      </section>
    </div>
  );
}

export default HowToUseBoardzy;
