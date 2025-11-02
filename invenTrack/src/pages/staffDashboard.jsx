import React from "react";
import "../styles/Home.css";

function StaffDashboard() {
  const categories = [
    {
      title: "Clothing Brands",
      brands: [
        { name: "Nike", image: "https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg" },
        { name: "Adidas", image: "https://upload.wikimedia.org/wikipedia/commons/2/20/Adidas_Logo.svg" },
        { name: "Reebok", image: "https://cdn.brandfetch.io/idpEk3GaAN/theme/dark/logo.svg?c=1dxbfHSJFAPEGdCLU4o5B" },
        { name: "Levi's", image: "https://cdn.brandfetch.io/idsJ1DFU3y/w/881/h/882/theme/dark/icon.jpeg?c=1dxbfHSJFAPEGdCLU4o5B" },
        { name: "Puma", image: "https://cdn.brandfetch.io/idDV9AjI6R/theme/dark/logo.svg?c=1dxbfHSJFAPEGdCLU4o5B" },
      ],
    },
    {
      title: "Cosmetic Brands",
      brands: [
        { name: "L'Oréal", image: "https://cdn.brandfetch.io/id6f2S_k6U/theme/dark/logo.svg?c=1dxbfHSJFAPEGdCLU4o5B" },
        { name: "Maybelline", image: "https://cdn.brandfetch.io/idyrSigJqW/theme/dark/logo.svg?c=1dxbfHSJFAPEGdCLU4o5B" },
        { name: "Lakme", image: "https://cdn.brandfetch.io/idEvRfBkwk/theme/dark/logo.svg?c=1dxbfHSJFAPEGdCLU4o5B" },
        { name: "Sephora", image: "https://cdn.brandfetch.io/idlz-76_gh/w/400/h/400/theme/dark/icon.jpeg?c=1dxbfHSJFAPEGdCLU4o5B" },
        { name: "Dove", image: "https://cdn.brandfetch.io/idUXiexVWt/theme/dark/logo.svg?c=1dxbfHSJFAPEGdCLU4o5B" },
        { name: "Nivea", image: "https://cdn.brandfetch.io/id3QcEBvXq/theme/dark/logo.svg?c=1dxbfHSJFAPEGdCLU4o5B" },
      ],
    },
    {
      title: "Mobile Brands",
      brands: [
        { name: "Apple", image: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg" },
        { name: "Samsung", image: "https://upload.wikimedia.org/wikipedia/commons/2/24/Samsung_Logo.svg" },
        { name: "OnePlus", image: "https://cdn.brandfetch.io/idi46coDvW/theme/dark/logo.svg?c=1dxbfHSJFAPEGdCLU4o5B" },
        { name: "Oppo", image: "https://cdn.brandfetch.io/id64aeE2b-/theme/dark/idF9iGuWuM.svg?c=1dxbfHSJFAPEGdCLU4o5B" },
        { name: "Lenovo", image: "https://cdn.brandfetch.io/iddtMrgJvA/theme/dark/logo.svg?c=1dxbfHSJFAPEGdCLU4o5B" },
        { name: "Vivo", image: "https://cdn.brandfetch.io/idYVgdb4Ec/theme/dark/logo.svg?c=1dxbfHSJFAPEGdCLU4o5B" },
      ],
    },
  ];

  return (
    <div className="home-container">
      <h1 className="home-title">Our Top Brands</h1>
      <p className="home-subtitle">Sales on Fire</p>

      {categories.map((category, index) => (
        <div key={index} className="category-section">
          <h2 className="category-title">{category.title}</h2>
          <div className="brand-grid">
            {category.brands.map((brand, idx) => (
              <div key={idx} className="brand-card">
                <img src={brand.image} alt={brand.name} />
                <h3>{brand.name}</h3>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default StaffDashboard;
