import {
  DollarSign,
  TrendingDown,
  Package,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";

export const Welcome = () => {
  return (
    <>
      <div className="Welcome-Wrapper">
        <div className="Welcome-Inner">
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
              <button>Başlayın</button>
              <button>Daha Ətraflı</button>
            </div>
          </div>
          <div></div>
        </div>
      </div>
    </>
  );
};
