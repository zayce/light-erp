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
      title: t("inventory_title"),
      desc: t("inventory_desc"),
    },
    {
      icon: <TrendingUp />,
      title: t("cashflow_title"),
      desc: t("cashflow_desc"),
    },
    {
      icon: <BarChart3 />,
      title: t("reports_title"),
      desc: t("reports_desc"),
    },
    {
      icon: <Shield />,
      title: t("security_title"),
      desc: t("security_desc"),
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
                <Package /> {t("WelcomeBadge")}
              </div>

              <h1 className="Welcome-Title">
                {t("titleWelcome").split("Hesabla")[0]}
                <span>Hesabla</span>
                {t("titleWelcome").split("Hesabla")[1]}
              </h1>

              <p className="Welcome-Desc">{t("descWelcome")}</p>

              <div className="Welcome-Buttons">
                <NavLink to="/dashboard">
                  <button className="primary">{t("startWelcome")}</button>
                </NavLink>
                <button className="secondary">{t("moreWelcome")}</button>
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
          <h2>{t("titleCta")}?</h2>
          <p>{t("descCta")}</p>
          <button>{t("buttonCta")}</button>
        </div>
      </section>
    </div>
  );
};
