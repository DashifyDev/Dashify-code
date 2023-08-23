"use client";
import './info.css'
import ChevronRightOutlinedIcon from '@mui/icons-material/ChevronRightOutlined';

function Info() {
  return (
    <div className='information'>
      <div className='wlcm_boardzy'>
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
      </div>
      <div className='about_boardzy'>
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
      </div>
      <div className='use_boardzy'>
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
      </div>
      <div className='checkout_templates'>
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
      </div>
      
      <div className='dashboard_Life'>
        
        <div className='dashboard-image'></div>
        <div className='dashboard_LifeContant'>
          <h2 className='section-heading'>Also: ‘Dashboard Your Life’</h2>
          <p>
          Looking for a framework to help organize life?
            </p>
             <p>Check out the <b>‘DYL’ Framework.</b></p>
        </div>

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
    </div>
  )
}

export default Info
