import { Package, TrendingUp, BarChart3, Shield } from "lucide-react";
import { NavLink } from "react-router-dom";
import "./Welcome.scss";
import { useTranslation } from "react-i18next";
import i18n from "../../i18n";
export const LandingPage = () => {
  const { t } = useTranslation();
  const features = [
    {
      icon: <Package />,
      title: "Anbar İdarəetməsi",
      desc: "Məhsulları asanlıqla izləyin, stok səviyyələrini idarə edin və təchizat zəncirini optimallaşdırın.",
    },
    {
      icon: <TrendingUp />,
      title: "Pul Axını",
      desc: "Gəlir və xərclərinizi real vaxt rejimində izləyin və maliyyə vəziyyətinizə nəzarət edin.",
    },
    {
      icon: <BarChart3 />,
      title: "Hesabatlar",
      desc: "Ətraflı analitika və hesabatlarla biznəsinizin performansını qiymətləndirin.",
    },
    {
      icon: <Shield />,
      title: "Təhlükəsizlik",
      desc: "Məlumatlarınız tam təhlükəsizlik altındadır və hər zaman əlçatandır.",
    },
  ];

  return (
    <div className="Landing">
      {/* HERO */}
      <section className="Welcome">
        <div className="container">
          <div className="Welcome-Inner">
            <div className="Welcome-Top-Block">
              <div className="Welcome-Small-Title">
                <Package /> Professional Anbar və Maliyyə Həlli
              </div>

              <h1 className="Welcome-Title">
                Biznesinizi <span>Hesabla</span> ilə idarə edin
              </h1>

              <p className="Welcome-Desc">
                Anbar idarəetməsi və pul axını izləməsi üçün güclü, istifadəsi
                asan platforma. Maliyyə proseslərini sadələşdirin və biznəsinizi
                böyüdün.
              </p>

              <div className="Welcome-Buttons">
                <NavLink to="/dashboard">
                  <button className="primary">Başlayın</button>
                </NavLink>
                <button className="secondary">Daha ətraflı</button>
              </div>

              <div className="flags">
                <button
                  className={i18n.language === "az" ? "active" : ""}
                  onClick={() => i18n.changeLanguage("az")}
                >
                  <span className="fi fi-az"></span>
                </button>

                <button
                  className={i18n.language === "ru" ? "active" : ""}
                  onClick={() => i18n.changeLanguage("ru")}
                >
                  <span className="fi fi-ru"></span>
                </button>

                <button
                  className={i18n.language === "en" ? "active" : ""}
                  onClick={() => i18n.changeLanguage("en")}
                >
                  <span className="fi fi-gb"></span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="Features">
        <div className="container">
          <div className="Features-Wrapper">
            {features.map((item, i) => (
              <div className="Feature-Card" key={i}>
                <div className="icon">{item.icon}</div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="CTA">
        <div className="container">
          <h2>Hazırsınız?</h2>
          <p>İndi başlayın və biznesinizi böyüdün</p>
          <button>Qeydiyyat</button>
        </div>
      </section>
    </div>
  );
};
