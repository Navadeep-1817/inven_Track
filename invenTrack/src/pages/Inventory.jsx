// src/components/Inventory.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/Inventory.css"; // Import the CSS file

const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    pCategory: "all",
    brand: "all",
    pSubCat: "all",
    priceRange: [0, 100000],
  });

  // Fetch inventory from backend
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/inventory");
        setInventory(res.data);
        setFilteredInventory(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchInventory();
  }, []);

  // Handle search and filter
  useEffect(() => {
    let data = [...inventory];

    // 🔎 Search
    if (search) {
      const s = search.toLowerCase();
      data = data.filter(
        (item) =>
          item.name.toLowerCase().includes(s) ||
          item.brand.toLowerCase().includes(s) ||
          (item.pSubCat && item.pSubCat.toLowerCase().includes(s))
      );
    }

    // 🗂 Filters
    if (filters.pCategory !== "all") {
      data = data.filter((item) => item.pCategory === filters.pCategory);
    }
    if (filters.brand !== "all") {
      data = data.filter((item) => item.brand === filters.brand);
    }
    if (filters.pSubCat !== "all") {
      data = data.filter((item) => item.pSubCat === filters.pSubCat);
    }
    data = data.filter(
      (item) =>
        item.price >= filters.priceRange[0] && item.price <= filters.priceRange[1]
    );

    setFilteredInventory(data);
  }, [search, filters, inventory]);

  // Unique options for dropdowns
  const categories = ["all", ...new Set(inventory.map((i) => i.pCategory))];
  const brands = ["all", ...new Set(inventory.map((i) => i.brand))];
  const subCats = ["all", ...new Set(inventory.map((i) => i.pSubCat).filter(Boolean))];

  return (
    <div className="inventory-container-inv">
      <div className="inventory-wrapper-inv">
        <div className="inventory-header-inv">
          <h1 className="inventory-title-inv">Inventory Management</h1>
          <p className="inventory-subtitle-inv">Track and manage your product inventory</p>
        </div>

        {/* Search */}
        <div className="search-container-inv">
          <span className="search-icon-inv">🔍</span>
          <input
            type="text"
            placeholder="Search by name, brand, sub-category..."
            className="search-input-inv"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div className="filters-container-inv">
          <select
            value={filters.pCategory}
            onChange={(e) => setFilters({ ...filters, pCategory: e.target.value })}
            className="filter-select-inv"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === "all" ? "All Categories" : c}
              </option>
            ))}
          </select>

          <select
            value={filters.brand}
            onChange={(e) => setFilters({ ...filters, brand: e.target.value })}
            className="filter-select-inv"
          >
            {brands.map((b) => (
              <option key={b} value={b}>
                {b === "all" ? "All Brands" : b}
              </option>
            ))}
          </select>

          <select
            value={filters.pSubCat}
            onChange={(e) => setFilters({ ...filters, pSubCat: e.target.value })}
            className="filter-select-inv"
          >
            {subCats.map((s) => (
              <option key={s} value={s}>
                {s === "all" ? "All Sub-Categories" : s}
              </option>
            ))}
          </select>

          {/* Price Range */}
          <input
            type="number"
            placeholder="Min Price"
            className="filter-input-inv"
            value={filters.priceRange[0]}
            onChange={(e) =>
              setFilters({ ...filters, priceRange: [Number(e.target.value), filters.priceRange[1]] })
            }
          />
          <input
            type="number"
            placeholder="Max Price"
            className="filter-input-inv"
            value={filters.priceRange[1]}
            onChange={(e) =>
              setFilters({ ...filters, priceRange: [filters.priceRange[0], Number(e.target.value)] })
            }
          />
        </div>

        {/* Inventory Table */}
        <div className="table-container-inv">
          <table className="inventory-table-inv">
            <thead>
              <tr>
                <th>PID</th>
                <th>Name</th>
                <th>Brand</th>
                <th>Category</th>
                <th>Sub-Category</th>
                <th>Attributes</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.map((item) => (
                <tr key={item.pid}>
                  <td>{item.pid}</td>
                  <td>{item.name}</td>
                  <td>{item.brand}</td>
                  <td>{item.pCategory}</td>
                  <td>{item.pSubCat || "-"}</td>
                  <td>
                    {item.attributes
                      ? Object.entries(item.attributes)
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(", ")
                      : "-"}
                  </td>
                  <td>₹{item.price}</td>
                  <td>{item.quantity}</td>
                  <td>
                    {new Date(item.lastUpdated).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredInventory.length === 0 && (
          <p className="empty-state-inv">No items match your search or filters.</p>
        )}
      </div>
    </div>
  );
};

export default Inventory;