"use client";
import './info.css'
import ChevronRightOutlinedIcon from '@mui/icons-material/ChevronRightOutlined';
import { useSearchParams, useRouter} from 'next/navigation';
import { useEffect } from 'react';
import Image from 'next/image';
import logo from '../../assets/whiteLogo.png'


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


  return (
    <div className='information'>
      <section className='wlcm_boardzy' id='1qw'>
        <div className='boardzy_logo'>
          <Image src={logo} alt='image' onClick={()=>router.push('/')}/>
        </div>
        <div className='wlcm_boardzyContant'>
          <h2>Welcome to Boardzy!</h2>
          <ul className='wlcm-boardzyContant-listStyle'>
            <li>A place to organize.</li>
            <li>To show who you are.</li>
            <li>To track what you do.</li>
            <li>To focus.</li>
          </ul>
          <h5>A place to create your own boardzy</h5>
        </div>
      </section>
      <section className='about_boardzy'  id='2qw'>
        <div className='about_boardzyContant'>
          <h2 className='section-heading'>What is Boardzy?</h2>
          <p>
          Boardzy is an app for creating “dashboards”.
          </p>
          <p>
          Dashboards centralize ideas & info. With Boardzy, create beautiful dashboards for your life, work, project, hobby, interests, ideas, lists, brainstorms, notes, etc.
          </p>
        </div>
        <div className='board_image'>
        </div>
      </section>
      <section className='use_boardzy' id='3qw'>
        <div className='use_image'>

        </div>
        <div className='use_boardzyContant'>
          <h2 className='section-heading'>How to use Boardzy</h2>
          <p>
          Check out the Library to make some of our examples your own.
          </p>
          <p>
          Or create a new board from scratch:
          </p>
          <ol type='number'>
            <li>
              Create +New Dashboard
            </li>
            <li>Add Tiles.</li>
            <li>Dress Tiles with Image or Colors</li>
            <li>Clicking Tiles opens Text Editor or Link. </li>

          </ol>
        </div>
      </section>
      <section className='checkout_templates' id='4qw'>
        <div className='checkout_templatesContant'>
          <h2 className='section-heading'>Browse Boards</h2>
          <p>
          Click here to check out our collection of pre-made boards.
          </p>
        <ul className='checkout_templatesLink'>
          <li>
            <a href='#'><ChevronRightOutlinedIcon/>Welcome Boardzy</a>
          </li>
          <li>
            <a href='#'><ChevronRightOutlinedIcon/>Vision NYC</a>
          </li>
          <li>
            <a href='#'><ChevronRightOutlinedIcon/>Kidz Boards</a>
          </li>
        </ul>
        </div>
        <img className='checkout-template-image'></img>
      </section>
      
      <section className='dashboard_Life' id='5qw'>
        
        <div className='dashboard-image'></div>
        <div className='dashboard_LifeContant'>
          <h2 className='section-heading'>Also: ‘Dashboard Your Life’</h2>
          <p>
          Looking for a framework to help organize life?
            </p>
             <p>Check out the <b>‘DYL’ Framework.</b></p>
        </div>

      </section>
      <section className='contact_us' id='6qw'>
        <div className='contact_usContant'>
          <h2>Contact Us</h2>
          <p>
            Email Us: <b>contact@boardzy.app</b><br/>
            Submit New Feature Ideas: 
            <a href='https://boardzy.canny.io/boardzy-feature-requests' target='_blank'>Boardzy Feature Requests</a>
          </p>
        </div>
      </section>
    </div>
  )
}

export default Info
