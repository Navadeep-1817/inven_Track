import React, { useState, useEffect, useRef } from "react";
import axiosInstance from "../../utils/axiosInstance";
import "../../styles/StaffBilling.css";

const StaffBilling = () => {
  const [branchInfo, setBranchInfo] = useState(null);
  const [staffInfo, setStaffInfo] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Customer Info
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });

  // Cart Items
  const [cartItems, setCartItems] = useState([]);
  
  // Search for products
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Bill Settings
  const [gstRate, setGstRate] = useState(18); // 18% GST
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [notes, setNotes] = useState("");

  // Generated Bill
  const [generatedBill, setGeneratedBill] = useState(null);
  const [showBillPreview, setShowBillPreview] = useState(false);
  const billRef = useRef(null);

  // Email sending state
  const [sendingEmail, setSendingEmail] = useState(false);
  
  // Saving state
  const [savingBill, setSavingBill] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      // Get staff info
      const staffRes = await axiosInstance.get("/auth/me");
      setStaffInfo(staffRes.data);
      
      const branchId = staffRes.data.branch_id;
      
      // Get branch details
      const branchRes = await axiosInstance.get("/branches");
      const branch = branchRes.data.find(b => b.branch_id === branchId);
      setBranchInfo(branch);
      
      // Get inventory
      const invRes = await axiosInstance.get(`/inventory/${branchId}`);
      let inventoryData = Array.isArray(invRes.data) ? invRes.data : invRes.data.inventoryItems || [];
      setInventory(inventoryData);
      
    } catch (error) {
      console.error("Error fetching data:", error);
      alert("Error loading data. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  // Search products
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const results = inventory.filter(item =>
        item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.pid?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.brand?.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 10);
      setSearchResults(results);
      setShowSearchResults(true);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  }, [searchQuery, inventory]);

  // Add item to cart
  const addToCart = (product) => {
    const existingItem = cartItems.find(item => item.pid === product.pid);
    
    if (existingItem) {
      if (existingItem.quantity < product.quantity) {
        setCartItems(cartItems.map(item =>
          item.pid === product.pid
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
      } else {
        alert("Cannot add more than available stock!");
      }
    } else {
      setCartItems([...cartItems, { ...product, quantity: 1 }]);
    }
    
    setSearchQuery("");
    setShowSearchResults(false);
  };

  // Update cart item quantity
  const updateQuantity = (pid, newQuantity) => {
    const product = inventory.find(p => p.pid === pid);
    
    if (newQuantity <= 0) {
      removeFromCart(pid);
      return;
    }
    
    if (newQuantity > product.quantity) {
      alert(`Only ${product.quantity} units available in stock!`);
      return;
    }
    
    setCartItems(cartItems.map(item =>
      item.pid === pid ? { ...item, quantity: newQuantity } : item
    ));
  };

  // Remove item from cart
  const removeFromCart = (pid) => {
    setCartItems(cartItems.filter(item => item.pid !== pid));
  };

  // Calculate totals
  const calculateTotals = () => {
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountAmount = (subtotal * discount) / 100;
    const taxableAmount = subtotal - discountAmount;
    const gstAmount = (taxableAmount * gstRate) / 100;
    const total = taxableAmount + gstAmount;
    
    return {
      subtotal: subtotal.toFixed(2),
      discountAmount: discountAmount.toFixed(2),
      taxableAmount: taxableAmount.toFixed(2),
      gstAmount: gstAmount.toFixed(2),
      total: total.toFixed(2),
    };
  };

  // Generate and save bill to backend
  const generateBill = async () => {
    if (!customerInfo.name || !customerInfo.phone) {
      alert("Please enter customer name and phone number!");
      return;
    }
    
    if (cartItems.length === 0) {
      alert("Please add items to cart!");
      return;
    }
    
    setSavingBill(true);
    
    try {
      const totals = calculateTotals();
      const billNumber = `INV-${Date.now()}`;
      const billDate = new Date().toLocaleString('en-IN');
      
      // Prepare bill data for backend
      const billData = {
        billNumber,
        customer: customerInfo,
        items: cartItems,
        totals,
        gstRate,
        discount,
        paymentMethod,
        notes,
        branch: branchInfo,
        staff: staffInfo,
      };
      
      // Save bill to backend
      const response = await axiosInstance.post('/bills', billData);
      
      if (response.data.success) {
        // Use the bill from backend response
        const savedBill = response.data.bill;
        
        // Format the bill for display
        const displayBill = {
          ...savedBill,
          billDate: new Date(savedBill.billDate).toLocaleString('en-IN'),
          customer: savedBill.customer,
          items: savedBill.items,
          totals: savedBill.totals,
          branch: {
            branch_id: savedBill.branchId,
            branch_name: savedBill.branchName,
            branch_location: savedBill.branchLocation
          },
          staff: {
            _id: savedBill.staffId,
            name: savedBill.staffName
          }
        };
        
        setGeneratedBill(displayBill);
        setShowBillPreview(true);
        
        // Refresh inventory after successful bill creation
        await fetchInitialData();
        
        alert("✅ Bill saved successfully!");
      }
    } catch (error) {
      console.error("Error saving bill:", error);
      
      if (error.response) {
        // Backend returned an error
        const errorMessage = error.response.data.message || "Failed to save bill";
        alert(`❌ ${errorMessage}`);
      } else {
        // Network or other error
        alert("❌ Failed to save bill. Please check your connection and try again.");
      }
    } finally {
      setSavingBill(false);
    }
  };

  // Download as PDF (using browser print)
  const downloadPDF = () => {
    window.print();
  };

  // Send email
  const sendEmail = async () => {
    if (!customerInfo.email) {
      alert("Please enter customer email!");
      return;
    }
    
    if (!generatedBill) {
      alert("No bill to send!");
      return;
    }
    
    setSendingEmail(true);
    
    try {
      // Call your backend API to send email
      const response = await axiosInstance.post('/bills/send-email', {
        billId: generatedBill._id,
        email: customerInfo.email
      });
      
      if (response.data.success) {
        alert(`✅ Bill sent successfully to ${customerInfo.email}!`);
      }
    } catch (error) {
      console.error("Error sending email:", error);
      alert("❌ Failed to send email. Please try again.");
    } finally {
      setSendingEmail(false);
    }
  };

  // Clear bill and start new
  const startNewBill = () => {
    setCustomerInfo({ name: "", phone: "", email: "", address: "" });
    setCartItems([]);
    setDiscount(0);
    setNotes("");
    setGeneratedBill(null);
    setShowBillPreview(false);
  };

  const totals = calculateTotals();

  if (loading) {
    return (
      <div className="billing-container-staff">
        <div className="loading-spinner-staff-bill">
          <div className="spinner-staff-bill"></div>
          <p>Loading billing system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="billing-container-staff">
      <div className="billing-wrapper-staff">
        
        {/* Header */}
        <div className="billing-header-staff">
          <div>
            <h1 className="page-title-staff-bill">🧾 Billing System</h1>
            <p className="page-subtitle-staff-bill">
              {branchInfo?.branch_name} - {staffInfo?.name}
            </p>
          </div>
          {generatedBill && (
            <button className="new-bill-btn-staff" onClick={startNewBill}>
              ➕ New Bill
            </button>
          )}
        </div>

        {!showBillPreview ? (
          <div className="billing-content-staff">
            {/* Left Side - Customer & Products */}
            <div className="billing-left-staff">
              
              {/* Customer Information */}
              <div className="section-card-staff">
                <h2 className="section-title-staff">👤 Customer Information</h2>
                <div className="form-grid-staff">
                  <div className="form-group-staff">
                    <label>Name *</label>
                    <input
                      type="text"
                      placeholder="Customer name"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="form-group-staff">
                    <label>Phone *</label>
                    <input
                      type="tel"
                      placeholder="Phone number"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="form-group-staff">
                    <label>Email</label>
                    <input
                      type="email"
                      placeholder="Email address"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                    />
                  </div>
                  
                  <div className="form-group-staff full-width-staff">
                    <label>Address</label>
                    <input
                      type="text"
                      placeholder="Customer address"
                      value={customerInfo.address}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Product Search */}
              <div className="section-card-staff">
                <h2 className="section-title-staff">🔍 Add Products</h2>
                <div className="search-box-staff">
                  <input
                    type="text"
                    placeholder="Search products by name, PID, or brand..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => searchQuery && setShowSearchResults(true)}
                  />
                  
                  {showSearchResults && searchResults.length > 0 && (
                    <div className="search-results-staff">
                      {searchResults.map(product => (
                        <div
                          key={product.pid}
                          className="search-result-item-staff"
                          onClick={() => addToCart(product)}
                        >
                          <div className="result-info-staff">
                            <p className="result-name-staff">{product.name}</p>
                            <p className="result-details-staff">
                              {product.brand} | Stock: {product.quantity}
                            </p>
                          </div>
                          <p className="result-price-staff">₹{product.price}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Cart Items */}
              <div className="section-card-staff">
                <h2 className="section-title-staff">🛒 Cart Items ({cartItems.length})</h2>
                
                {cartItems.length === 0 ? (
                  <div className="empty-cart-staff">
                    <p>🛒 Cart is empty. Add products to start billing.</p>
                  </div>
                ) : (
                  <div className="cart-items-staff">
                    {cartItems.map((item, index) => (
                      <div key={item.pid} className="cart-item-staff">
                        <div className="item-number-staff">{index + 1}</div>
                        <div className="item-details-staff">
                          <p className="item-name-staff">{item.name}</p>
                          <p className="item-meta-staff">{item.brand} | {item.pid}</p>
                          <p className="item-price-staff">₹{item.price} per unit</p>
                        </div>
                        <div className="item-quantity-staff">
                          <button onClick={() => updateQuantity(item.pid, item.quantity - 1)}>-</button>
                          <span>{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.pid, item.quantity + 1)}>+</button>
                        </div>
                        <div className="item-total-staff">
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </div>
                        <button 
                          className="item-remove-staff"
                          onClick={() => removeFromCart(item.pid)}
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Side - Summary */}
            <div className="billing-right-staff">
              
              {/* Bill Settings */}
              <div className="section-card-staff">
                <h2 className="section-title-staff">⚙️ Bill Settings</h2>
                
                <div className="form-group-staff">
                  <label>GST Rate (%)</label>
                  <input
                    type="number"
                    value={gstRate}
                    onChange={(e) => setGstRate(Number(e.target.value))}
                    min="0"
                    max="100"
                  />
                </div>
                
                <div className="form-group-staff">
                  <label>Discount (%)</label>
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    min="0"
                    max="100"
                  />
                </div>
                
                <div className="form-group-staff">
                  <label>Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="Cash">Cash</option>
                    <option value="Card">Debit/Credit Card</option>
                    <option value="UPI">UPI</option>
                    <option value="Net Banking">Net Banking</option>
                  </select>
                </div>
                
                <div className="form-group-staff">
                  <label>Notes</label>
                  <textarea
                    placeholder="Add any notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows="3"
                  ></textarea>
                </div>
              </div>

              {/* Bill Summary */}
              <div className="section-card-staff summary-card-staff">
                <h2 className="section-title-staff">💰 Bill Summary</h2>
                
                <div className="summary-row-staff">
                  <span>Subtotal:</span>
                  <span>₹{totals.subtotal}</span>
                </div>
                
                {discount > 0 && (
                  <div className="summary-row-staff discount-row-staff">
                    <span>Discount ({discount}%):</span>
                    <span>- ₹{totals.discountAmount}</span>
                  </div>
                )}
                
                <div className="summary-row-staff">
                  <span>Taxable Amount:</span>
                  <span>₹{totals.taxableAmount}</span>
                </div>
                
                <div className="summary-row-staff">
                  <span>GST ({gstRate}%):</span>
                  <span>₹{totals.gstAmount}</span>
                </div>
                
                <div className="summary-divider-staff"></div>
                
                <div className="summary-row-staff total-row-staff">
                  <span>Total Amount:</span>
                  <span>₹{totals.total}</span>
                </div>
                
                <button 
                  className="generate-bill-btn-staff"
                  onClick={generateBill}
                  disabled={cartItems.length === 0 || !customerInfo.name || !customerInfo.phone || savingBill}
                >
                  {savingBill ? "💾 Saving Bill..." : "🧾 Generate Bill"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Bill Preview */
          <div className="bill-preview-container-staff">
            <div className="bill-actions-staff no-print">
              <button onClick={downloadPDF} className="action-btn-staff pdf-btn-staff">
                📥 Download PDF
              </button>
              <button 
                onClick={sendEmail} 
                className="action-btn-staff email-btn-staff"
                disabled={!customerInfo.email || sendingEmail}
              >
                {sendingEmail ? "📧 Sending..." : "📧 Email Bill"}
              </button>
              <button onClick={() => setShowBillPreview(false)} className="action-btn-staff back-btn-staff">
                ← Back to Edit
              </button>
            </div>

            {/* Printable Bill */}
            <div className="bill-printable-staff" ref={billRef}>
              <div className="bill-header-print-staff">
                <div className="company-info-staff">
                  <h1>{generatedBill?.branch?.branch_name || branchInfo?.branch_name || "Store Name"}</h1>
                  <p>{generatedBill?.branch?.branch_location || branchInfo?.branch_location || "Store Location"}</p>
                  <p>Branch ID: {generatedBill?.branch?.branch_id || branchInfo?.branch_id}</p>
                  <p>GSTIN: 29ABCDE1234F1Z5</p>
                </div>
                <div className="invoice-info-staff">
                  <h2>TAX INVOICE</h2>
                  <p><strong>Invoice No:</strong> {generatedBill?.billNumber}</p>
                  <p><strong>Date:</strong> {generatedBill?.billDate}</p>
                </div>
              </div>

              <div className="bill-divider-staff"></div>

              <div className="bill-parties-staff">
                <div className="party-staff">
                  <h3>Bill To:</h3>
                  <p><strong>{generatedBill?.customer.name}</strong></p>
                  <p>Phone: {generatedBill?.customer.phone}</p>
                  {generatedBill?.customer.email && <p>Email: {generatedBill.customer.email}</p>}
                  {generatedBill?.customer.address && <p>{generatedBill.customer.address}</p>}
                </div>
                <div className="party-staff">
                  <h3>Billed By:</h3>
                  <p><strong>{generatedBill?.staff?.name || staffInfo?.name}</strong></p>
                  <p>Staff ID: {generatedBill?.staff?._id || staffInfo?._id}</p>
                </div>
              </div>

              <table className="bill-table-staff">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Product Details</th>
                    <th>HSN/SAC</th>
                    <th>Qty</th>
                    <th>Rate</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {generatedBill?.items.map((item, index) => (
                    <tr key={item.pid}>
                      <td>{index + 1}</td>
                      <td>
                        <strong>{item.name}</strong><br/>
                        <small>{item.brand} | {item.pid}</small>
                      </td>
                      <td>8471</td>
                      <td>{item.quantity}</td>
                      <td>₹{item.price.toFixed(2)}</td>
                      <td>₹{(item.price * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="bill-totals-staff">
                <div className="totals-left-staff">
                  <p><strong>Payment Method:</strong> {generatedBill?.paymentMethod}</p>
                  {generatedBill?.notes && (
                    <p><strong>Notes:</strong> {generatedBill.notes}</p>
                  )}
                </div>
                <div className="totals-right-staff">
                  <div className="total-row-bill-staff">
                    <span>Subtotal:</span>
                    <span>₹{generatedBill?.totals.subtotal}</span>
                  </div>
                  {generatedBill?.discount > 0 && (
                    <div className="total-row-bill-staff">
                      <span>Discount ({generatedBill?.discount}%):</span>
                      <span>- ₹{generatedBill?.totals.discountAmount}</span>
                    </div>
                  )}
                  <div className="total-row-bill-staff">
                    <span>Taxable Amount:</span>
                    <span>₹{generatedBill?.totals.taxableAmount}</span>
                  </div>
                  <div className="total-row-bill-staff">
                    <span>CGST ({generatedBill?.gstRate/2}%):</span>
                    <span>₹{(generatedBill?.totals.gstAmount / 2).toFixed(2)}</span>
                  </div>
                  <div className="total-row-bill-staff">
                    <span>SGST ({generatedBill?.gstRate/2}%):</span>
                    <span>₹{(generatedBill?.totals.gstAmount / 2).toFixed(2)}</span>
                  </div>
                  <div className="total-row-bill-staff final-total-staff">
                    <span><strong>Total Amount:</strong></span>
                    <span><strong>₹{generatedBill?.totals.total}</strong></span>
                  </div>
                </div>
              </div>

              <div className="bill-footer-staff">
                <p className="thank-you-staff">Thank you for your business!</p>
                <p className="footer-note-staff">This is a computer-generated invoice and does not require a signature.</p>
                <p className="terms-staff">Terms & Conditions: Goods once sold cannot be returned or exchanged.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffBilling;