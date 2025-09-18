import React, { useState } from "react";

import "../Styles/inventory.css"
const branchInventory = {
  branch: "Downtown",
  brands: [
    {
      name: "Nike",
      shirts: { S: 10, M: 25, L: 15, XL: 8 },
      pants: { S: 5, M: 12, L: 20, XL: 7 },
    },
    {
      name: "Adidas",
      shirts: { S: 8, M: 20, L: 17, XL: 10 },
      pants: { S: 4, M: 14, L: 18, XL: 5 },
    },
    {
      name: "Puma",
      shirts: { S: 12, M: 18, L: 22, XL: 9 },
      pants: { S: 6, M: 15, L: 19, XL: 4 },
    },
  ],
};

export default function Inventory() {
  const [search, setSearch] = useState("");

  const filteredBrands = branchInventory.brands.filter((brand) =>
    brand.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="inventory-container">
      <h1 className="title">InvenTrack Inventory</h1>
      <h2 className="branch">Branch: {branchInventory.branch}</h2>

      {/* Search */}
      <div className="search-box">
        <input
          type="text"
          placeholder="Search brand..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Brand Inventory */}
      <div className="brand-grid">
        {filteredBrands.map((brand, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="brand-card"
          >
            <h3 className="brand-name">{brand.name}</h3>

            <div>
              <p className="section-title">Shirts:</p>
              <ul className="item-list">
                {Object.entries(brand.shirts).map(([size, qty]) => (
                  <li key={size}>{size}: {qty}</li>
                ))}
              </ul>
            </div>

            <div>
              <p className="section-title">Pants:</p>
              <ul className="item-list">
                {Object.entries(brand.pants).map(([size, qty]) => (
                  <li key={size}>{size}: {qty}</li>
                ))}
              </ul>
            </div>
          </motion.div>
        ))}
      </div>

      {/* No Results */}
      {search && filteredBrands.length === 0 && (
        <p className="no-results">No brands found for "{search}"</p>
      )}  
    </div>
  );
}
