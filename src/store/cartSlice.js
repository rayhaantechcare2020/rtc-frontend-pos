import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  subtotal: 0,
  discount: 0,
  total: 0,
  customer: null,
  paymentMethod: 'cash'
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const product = action.payload;
      //console.log('Adding product:', product);
      
      // Check if item exists by product_id
      const existingIndex = state.items.findIndex(
        item => Number(item.product_id) === Number(product.product_id)
      );
      
      if (existingIndex >= 0) {
        // Update existing item
        state.items[existingIndex].quantity += 1; /**product.quantity || 1;*/
        state.items[existingIndex].subtotal = 
          state.items[existingIndex].quantity * state.items[existingIndex].price;
      } else {
        // Add new item
        const newItem = {
          product_id: Number(product.product_id),
          name: product.name,
          price: Number(product.price),
          quantity: product.quantity || 1,
          stock: product.stock || 0,
          subtotal: (product.quantity || 1) * Number(product.price)
        };
        state.items.push(newItem);
      }
      
      // Recalculate totals
      state.subtotal = state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      state.total = state.subtotal - state.discount;
    },
    
    updateQuantity: (state, action) => {
      const { productId, quantity } = action.payload;
     // console.log('Updating quantity:', { productId, quantity });
      
      // Find the item by product_id
      const existingIndex = state.items.findIndex(
        item => Number(item.product_id) === Number(productId)
      );
      
      if (existingIndex >= 0) {
        if (quantity <= 0) {
          // Remove item if quantity is 0 or negative
          state.items.splice(existingIndex, 1);
        } else {
          // Update the existing item
          state.items[existingIndex].quantity = quantity;
          state.items[existingIndex].subtotal = 
            quantity * state.items[existingIndex].price;
        }
      } else {
        //console.warn('Item not found for update:', productId);
      }
      
      // Recalculate totals
      state.subtotal = state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      state.total = state.subtotal - state.discount;
    },
    
    removeFromCart: (state, action) => {
      const productId = action.payload;
      //console.log('Removing item:', productId);
      
      state.items = state.items.filter(
        item => Number(item.product_id) !== Number(productId)
      );
      
      state.subtotal = state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      state.total = state.subtotal - state.discount;
    },
    
    clearCart: (state) => {
      state.items = [];
      state.subtotal = 0;
      state.discount = 0;
      state.total = 0;
      state.customer = null;
    },
    
    setDiscount: (state, action) => {
      state.discount = action.payload;
      state.total = state.subtotal - state.discount;
    },
    
    setCustomer: (state, action) => {
      state.customer = action.payload;
    },
    
    setPaymentMethod: (state, action) => {
      state.paymentMethod = action.payload;
    }
  }
});

export const { 
  addToCart, 
  removeFromCart, 
  updateQuantity, 
  setDiscount, 
  setCustomer, 
  setPaymentMethod, 
  clearCart 
} = cartSlice.actions;

export default cartSlice.reducer;