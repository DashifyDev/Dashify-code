"use client";
import './info.css'
import ChevronRightOutlinedIcon from '@mui/icons-material/ChevronRightOutlined';

function Info() {
  return (
    <div className='information'>
      <div className='wlcm_boardzy'>
        <div className='wlcm_boardzyContant'>
          <h2>Welcome to Boardzy!</h2>
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit,
            sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </p>
        </div>
      </div>
      <div className='about_boardzy'>
        <div className='about_boardzyContant'>
          <h2>What is Boardzy?</h2>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
            incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,
            quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
          </p>
        </div>
        <div className='board_image'>
        </div>
      </div>
      <div className='use_boardzy'>
        <div className='use_image'>

        </div>
        <div className='use_boardzyContant'>
          <h2>How to use Boardzy</h2>
          <p>
            Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu
            fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident,
            sunt in culpa qui officia deserunt mollit anim id est laborum.
          </p>
        </div>
      </div>
      <div className='checkout_templates'>
        <div className='checkout_templatesContant'>
          <h2>Check out the Templates</h2>
          <p>
            Click below to browse our pre-made Boardzy boards!
          </p>
        </div>
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
      <div className='contact_us'>
        <div className='contact_usContant'>
          <h2>Contact Us</h2>
          <p>
            Email Us: <b>contact@boardzy.app</b><br/>
            Submit New Feature Ideas: 
            <a href='https://boardzy.canny.io/boardzy-feature-requests' target='_blank'>Boardzy Feature Requests</a>
          </p>
        </div>
      </div>
      <div className='dashboard_Life'>
        <div className='dashboard_LifeContant'>
          <h2>Also: ‘Dashboard Your Life’</h2>
          <p>
            Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu 
             fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident,
             sunt in culpa qui officia deserunt mollit anim id est laborum.
            </p>
        </div>
      </div>
    </div>
  )
}

export default Info
