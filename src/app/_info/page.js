"use client";
import "./info.css";
import ChevronRightOutlinedIcon from "@mui/icons-material/ChevronRightOutlined";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import logo from "../../assets/whiteLogo.png";
import Link from "next/link";
import tikTokIcon from "../../assets/tiktok.svg";
import facebookIcon from "../../assets/facebook.svg";
import instagramIcon from "../../assets/instagram.svg";

function Info() {
  const searchParmas = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    let section = searchParmas.get("sectionId");
    if (section) {
      const sectionElement = document.getElementById(section);
      if (sectionElement) {
        sectionElement.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, []);

  const handleSubscribe = () => {
    <div class="ml-embedded" data-form="BmXBQV"></div>;
  };

  return (
    <div className="information">
      <section className="wlcm_boardzy" id="1qw">
        <div className="boardzy_logo">
          <Image src={logo} alt="image" onClick={() => router.push("/")} />
        </div>
        <div className="wlcm_boardzyContant">
          <h1>Welcome to Boardzy!</h1>
          <ul className="wlcm-boardzyContant-listStyle">
            <li>A place to organize.</li>
            <li>To visualize your dreams</li>
            <li>To bring ideas to life</li>
          </ul>
          <h5 style={{ textAlign: "center" }}>
            A place to create your boardzy
          </h5>
        </div>
      </section>
      <section className="mobile-web-information">
        <p>The Boardzy web app is not yet optimized for mobile.</p>
        <p>Please visit on a desktop device.</p>
      </section>

      <section className="about_boardzy" id="2qw">
        <div className="about_boardzyContant">
          <h2 className="section-heading">What is Boardzy?</h2>
          <p>
            Boardzy is an app for creating, well…boards! Boards to organize
            life, dreams, goals. Boards for travel plans, wishlists, vision
            boards & projects.
          </p>
          <p>Boardzy can help you board anything!!</p>
        </div>
        <div className="board_image"></div>
      </section>
      <section className="use_boardzy" id="3qw">
        <iframe
          src="https://www.youtube.com/embed/nfij5KmRi2s?si=hthvHiFmYqc6vPDW"
          title="YouTube video player"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen
        />

        <div className="use_boardzyContant">
          <h2 className="section-heading">How to use Boardzy</h2>
          <p>
            Create boards on Boardzy by using a template or starting from
            scratch.
          </p>
          <p>
            Either way, check out this video to learn more about how to use
            Boardzy
          </p>
          {/* <ol type="number">
            <li>+New Dashboard</li>
            <li>+Boxes</li>
            <li>...Edit Box Images,Color & Text</li>
          </ol> */}
          {/* <p>Check out <Link style={{fontWeight:"bold"}} href={"#"}>VIDEO</Link> or <b>The ‘Dashboard Your Life’</b></p> */}
          {/* <p><b>Framework</b> for more help!</p> */}
        </div>
      </section>
      <section className="checkout_templates" id="4qw">
        <div className="checkout_templatesContant">
          <h2 className="section-heading">Boards Library</h2>
          <p>
            Get a head start creating your own Boardzy board by visiting our{" "}
            <Link href={"https://www.boardzy.app/library"}>
              <b>Dashboard Library</b>
            </Link>
          </p>
          {/* <p>
            <Link href={"https://www.boardzy.app/library"}>
              <b>Dashboard Library</b>
            </Link>
          </p> */}
        </div>
        <div className="checkout-template-image"></div>
      </section>

      <section className="dashboard_Life" id="5qw">
        <div className="dashboard-image"></div>
        <div className="dashboard_LifeContant">
          <h2 className="section-heading">Also: Dashboard Your Life!</h2>
          <p>Looking for a better way to organize?</p>
          <p>
            Check out this simple, but effective framework to help organize your
            life with dashboards, here on Boardzy.
          </p>
          <p>
            <Link href={"https://dashboardyourlife.com/"}>
              <b>The ‘Dashboard Your Life’ Framework</b>
            </Link>
          </p>
        </div>
      </section>
      <section className="contact_us" id="6qw">
        <div className="contact_usContant">
          <h2>Hang With Us...</h2>
          <div className="footer-icon-class">
            <Image src={tikTokIcon} alt="TikTok"></Image>
            <Image src={instagramIcon} alt="Instagram"></Image>
            <Image src={facebookIcon} alt="Facebook"></Image>
          </div>
        </div>
        <div className="subscription-class">
          <h2>Subscribe for updates</h2>
          <div className="subscription-class-content">
            <input placeholder="Name" />
            <input placeholder="Email" />
            <button className="subscription-class-button">SUBSCRIBE</button>
          </div>
        </div>
        <div>
          <h2 style={{ margin: "90px 0px" }}>
            Email: <b>contact@boardzy.app</b>
          </h2>
          <h3>
            Submit New Feature Ideas:
            <br />
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

export default Info;
