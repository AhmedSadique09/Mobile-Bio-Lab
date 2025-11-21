import { HttpService } from './base.service';

class ProtocolService extends HttpService {
    /**
     * Get all protocols
     * @param filters Filters for protocols
     * @param page Page number
     * @param limit Items per page
     */
    getProtocols = async (filters: {
        category?: string;
        difficulty?: string;
        search?: string;
    } = {}, page: number = 1, limit: number = 10) => {
        return this.get('protocols', { ...filters, page, limit });
    };

    /**
     * Get a specific protocol by ID
     * @param id Protocol ID
     */
    getProtocolById = async (id: number) => {
        return this.get(`protocols/${id}`);
    };

    /**
     * Create a new protocol (Admin only)
     * @param protocolData Protocol data
     */
    createProtocol = async (protocolData: any) => {
        return this.post('protocols', protocolData);
    };

    /**
     * Update a protocol (Admin only)
     * @param id Protocol ID
     * @param protocolData Updated protocol data
     */
    updateProtocol = async (id: number, protocolData: any) => {
        return this.put(`protocols/${id}`, protocolData);
    };

    /**
     * Delete a protocol (Admin only)
     * @param id Protocol ID
     */
    deleteProtocol = async (id: number) => {
        return this.delete(`protocols/${id}`);
    };

    /**
     * Toggle publish status (Admin only)
     * @param id Protocol ID
     */
    togglePublishStatus = async (id: number) => {
        return this.put(`protocols/${id}/publish`, {});
    };
}

export default new ProtocolService();
