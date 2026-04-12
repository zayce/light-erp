import { Package } from "lucide-react";

import "../Welcome/Welcome.scss";
import { NavLink } from "react-router-dom";
export const Welcome = () => {
  return (
    <div className="Welcome">
      <div className="Welcome-Wrapper">
        <div className="Welcome-Inner">
          {/* LEFT */}
          <div className="Welcome-Top-Block">
            <div className="Welcome-Small-Title">
              <Package />
              Professional Anbar və Maliyyə Həlli
            </div>

            <div className="Welcome-Title">
              Biznəsinizi <span>Hesabla</span> ilə İdarə Edin
            </div>

            <div className="Welcome-Desc">
              Anbar idarəetməsi və pul axını izləməsi üçün güclü, istifadəsi
              asan platforma. Maliyyə proseslərini sadələşdirin və biznəsinizi
              böyüdün.
            </div>

            <div className="Welcome-Buttons">
              <NavLink to="/dashboard">
                <button className="primary">Başlayın</button>
              </NavLink>
              <button className="secondary">Daha Ətraflı</button>
            </div>
          </div>

          {/* RIGHT IMAGE */}
          <div className="Welcome-Image">
            <img alt="anbar" />
            <div className="overlay"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
