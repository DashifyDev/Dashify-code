"use client";
import './info.css'
import ChevronRightOutlinedIcon from '@mui/icons-material/ChevronRightOutlined';
import { useSearchParams, useRouter} from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import logo from '../../assets/whiteLogo.png'
import Link from 'next/link';
import tikTokIcon from"../../assets/tiktok.svg"
import facebookIcon from"../../assets/facebook.svg"
import instagramIcon from"../../assets/instagram.svg"

function Info() {
  const searchParmas = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    let section = searchParmas.get('sectionId')
    if (section) {
      const sectionElement = document.getElementById(section);
      if (sectionElement) {
        sectionElement.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, []);

  const handleSubscribe=()=>{
    <div class="ml-embedded" data-form="BmXBQV"></div>
  }


  return (
    <div className="information">
      <section className="wlcm_boardzy" id="1qw">
        <div className="boardzy_logo">
          <Image src={logo} alt="image" onClick={() => router.push("/")} />
        </div>
        <div className="wlcm_boardzyContant">
          <h2>Welcome to Boardzy!</h2>
          <ul className="wlcm-boardzyContant-listStyle">
            <li>A place to organize.</li>
            <li>To track all the things</li>
            <li>To visualize your dreams</li>
            <li>To focus.</li>
          </ul>
          <h5>A place to create your boardzy</h5>
        </div>
      </section>
      <section className="about_boardzy" id="2qw">
        <div className="about_boardzyContant">
          <h2 className="section-heading">What is Boardzy?</h2>
          <p>Boardzy is an app for creating “dashboards”.</p>
          <p>
          Create beautiful dashboards for your life, work, project, ideas, hobbies, etc.. Dashboard anything with Boardzy.
          </p>
        </div>
        <div className="board_image"></div>
      </section>
      <section className="use_boardzy" id="3qw">
        <div className="use_image"></div>
        <div className="use_boardzyContant">
          <h2 className="section-heading">How to use Boardzy</h2>
          <p>Grab a dashboard from the Dashboards Library.</p>
          <p>Or create a new board from scratch:</p>
          <ol type="number">
            <li>+New Dashboard</li>
            <li>+Boxes</li>
            <li>...Edit Box Images,Color & Text</li>
          </ol>
          <p>Check out <Link style={{fontWeight:"bold"}} href={"#"}>VIDEO</Link> or <b>The ‘Dashboard Your Life’</b></p>
          <p><b>Framework</b> for more help!</p>
        </div>
      </section>
      <section className="checkout_templates" id="4qw">
        <div className="checkout_templatesContant">
          <h2 className="section-heading">Boards Library</h2>
          <p><Link href={"https://www.boardzy.app/library"}><b>Click here</b></Link> for <b>Boardzy’s Boards Library.</b></p>
          <p>Personal dashboards, work dashboards, school, fitness, travel, project…we’ve got dashboards for days.</p>
        </div>
        <div className="checkout-template-image"></div>
      </section>

      <section className="dashboard_Life" id="5qw">
        <div className="dashboard-image"></div>
        <div className="dashboard_LifeContant">
          <h2 className="section-heading">Dashboard Your Life!</h2>
          <p>Check out this simple, but powerful framework for organizing your life with dashboards.</p>
          <p>
            <Link href={"https://dashboardyourlife.com/"}><b>The ‘DYL’ Framework.</b></Link>
          </p>
        </div>
      </section>
      <section className="contact_us" id="6qw">
        <div className="contact_usContant">
          <h2>Hang With Us...</h2>
          <div className='footer-icon-class'>
            <Image src={tikTokIcon} alt='TikTok'></Image>
            <Image src={instagramIcon} alt='Instagram'></Image>
            <Image src={facebookIcon} alt='Facebook'></Image>
          </div>
        </div>
          <div className='subscription-class'>
          <h2>
        Subscribe for updates
      </h2>
        <div className='subscription-class-content'>
          <input placeholder='Name'/>
          <input placeholder='Email'/>
          <button className='subscription-class-button'>SUBSCRIBE</button>
        </div>
          </div>
               <div>
               <h2 style={{margin:"90px 0px"}}>
            Email:  <b>contact@boardzy.app</b>
          </h2>
          <h3>
            Submit New Feature Ideas:
            <br/>
          <a
              href="https://boardzy.canny.io/boardzy-feature-requests"
              target="_blank"
            >
              Boardzy Feature Requests
            </a>
          </h3>
              </div>
      </section>
    </div>
  );
}

export default Info
