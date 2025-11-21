export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  mobile: string;
  role: 'student' | 'researcher' | 'technician' | 'admin';
  city: string;
  profilePicture?: string;
  createdAt: string;
}

export interface Sample {
  id: string;
  sampleId: string;
  userId: string;
  collectionDate: string;
  collectionTime: string;
  sampleType: 'water' | 'soil' | 'plant' | 'biological-fluids' | 'other';
  geolocation: {
    latitude: number;
    longitude: number;
  };
  fieldConditions: {
    temperature?: number;
    pH?: number;
    salinity?: number;
    humidity?: number;
    [key: string]: number | undefined;
  };
  notes?: string;
  status: 'pending' | 'processing' | 'completed';
  createdAt: string;
}

export interface Booking {
  id: string;
  userId: string;
  date: string;
  timeSlot: string;
  purpose: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  createdAt: string;
}

export interface Protocol {
  id: string;
  title: string;
  description: string;
  category: string;
  experimentType: string;
  steps: string[];
  createdBy: string;
  createdAt: string;
}

export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: 'sample' | 'report' | 'booking' | 'system';
  read: boolean;
  createdAt: string;
  metadata?: {
    sampleId?: number;
    sampleIdString?: string;
    reportId?: number;
    oldStatus?: string;
    newStatus?: string;
    [key: string]: any;
  };
}

export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  details: string;
  timestamp: string;
}
