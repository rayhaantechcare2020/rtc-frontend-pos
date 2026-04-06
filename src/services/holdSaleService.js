// services/holdSaleService.js
import api from './api';

export const holdSaleService = {
    /**
     * Hold current sale
     */
    async holdSale(cartData) {
        try {
            const response = await api.post('/pos/hold-sale', cartData);
            return response.data;
        } catch (error) {
            console.error('Error holding sale:', error);
            throw error;
        }
    },

    /**
     * Get all held sales
     */
    async getHeldSales() {
        try {
            const response = await api.get('/pos/held-sales');
            return response.data;
        } catch (error) {
            console.error('Error fetching held sales:', error);
            throw error;
        }
    },

    /**
     * Get single held sale by reference
     */
    async getHeldSale(reference) {
        try {
            const response = await api.get(`/pos/held-sale/${reference}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching held sale:', error);
            throw error;
        }
    },

    /**
     * Restore held sale to cart
     */
    async restoreHeldSale(reference) {
        try {
            const response = await api.post(`/pos/restore-held-sale/${reference}`);
            return response.data;
        } catch (error) {
            console.error('Error restoring held sale:', error);
            throw error;
        }
    },

    /**
     * Delete/cancel held sale
     */
    async deleteHeldSale(reference) {
        try {
            const response = await api.delete(`/pos/held-sale/${reference}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting held sale:', error);
            throw error;
        }
    },

    /**
     * Mark held sale as converted
     */
    async convertHeldSale(reference) {
        try {
            const response = await api.post(`/pos/convert-held-sale/${reference}`);
            return response.data;
        } catch (error) {
            console.error('Error converting held sale:', error);
            throw error;
        }
    }
};

export default holdSaleService;