import { type User, type Sample, type Booking, type Protocol, type Notification, type ActivityLog } from '../types';

export const mockUsers: User[] = [
  {
    id: '1',
    username: 'admin',
    email: 'admin@biolab.com',
    firstName: 'Admin',
    lastName: 'User',
    mobile: '+1234567890',
    role: 'admin',
    city: 'New York',
    profilePicture: 'https://images.unsplash.com/photo-1742206594477-15139139c0df?w=150&h=150&fit=crop',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    username: 'jsmith',
    email: 'john.smith@university.edu',
    firstName: 'John',
    lastName: 'Smith',
    mobile: '+1234567891',
    role: 'researcher',
    city: 'Boston',
    profilePicture: 'https://images.unsplash.com/photo-1583912372139-6a46eb6eb119?w=150&h=150&fit=crop',
    createdAt: '2024-02-15T00:00:00Z'
  },
  {
    id: '3',
    username: 'ejohnson',
    email: 'emily.johnson@university.edu',
    firstName: 'Emily',
    lastName: 'Johnson',
    mobile: '+1234567892',
    role: 'student',
    city: 'Cambridge',
    createdAt: '2024-03-20T00:00:00Z'
  }
];

export const mockSamples: Sample[] = [
  {
    id: 'S001',
    sampleId: 'WTR-2025-001',
    userId: '2',
    collectionDate: '2025-10-10',
    collectionTime: '09:30',
    sampleType: 'water',
    geolocation: { latitude: 42.3601, longitude: -71.0589 },
    fieldConditions: {
      temperature: 22.5,
      pH: 7.2,
      salinity: 0.5
    },
    notes: 'River water sample from Charles River',
    status: 'completed',
    createdAt: '2025-10-10T09:30:00Z'
  },
  {
    id: 'S002',
    sampleId: 'SL-2025-002',
    userId: '2',
    collectionDate: '2025-10-11',
    collectionTime: '14:15',
    sampleType: 'soil',
    geolocation: { latitude: 42.3736, longitude: -71.1097 },
    fieldConditions: {
      temperature: 18.3,
      pH: 6.5,
      humidity: 65
    },
    notes: 'Agricultural soil sample',
    status: 'processing',
    createdAt: '2025-10-11T14:15:00Z'
  },
  {
    id: 'S003',
    sampleId: 'PLT-2025-003',
    userId: '3',
    collectionDate: '2025-10-12',
    collectionTime: '11:00',
    sampleType: 'plant',
    geolocation: { latitude: 42.3656, longitude: -71.0624 },
    fieldConditions: {
      temperature: 24.1,
      humidity: 58
    },
    notes: 'Leaf tissue from oak tree',
    status: 'pending',
    createdAt: '2025-10-12T11:00:00Z'
  }
];

export const mockBookings: Booking[] = [
  {
    id: 'B001',
    userId: '2',
    date: '2025-10-15',
    timeSlot: '09:00 - 11:00',
    purpose: 'Water quality analysis',
    status: 'approved',
    createdAt: '2025-10-08T10:00:00Z'
  },
  {
    id: 'B002',
    userId: '3',
    date: '2025-10-16',
    timeSlot: '14:00 - 16:00',
    purpose: 'Plant tissue analysis',
    status: 'pending',
    createdAt: '2025-10-10T15:30:00Z'
  }
];

export const mockProtocols: Protocol[] = [
  {
    id: 'P001',
    title: 'Water Quality Testing Protocol',
    description: 'Standard procedure for testing water samples for pH, turbidity, and contaminants',
    category: 'Environmental',
    experimentType: 'Water Analysis',
    steps: [
      'Collect water sample in sterile container',
      'Measure temperature using calibrated thermometer',
      'Test pH using pH meter or strips',
      'Measure turbidity using nephelometer',
      'Test for contaminants using appropriate test kits',
      'Record all measurements in lab notebook',
      'Store sample at 4°C if further analysis needed'
    ],
    createdBy: '1',
    createdAt: '2024-01-15T00:00:00Z'
  },
  {
    id: 'P002',
    title: 'Soil Microbiome Analysis',
    description: 'Protocol for analyzing microbial communities in soil samples',
    category: 'Microbiology',
    experimentType: 'Soil Analysis',
    steps: [
      'Collect soil sample using sterile spatula',
      'Weigh 10g of soil sample',
      'Add to sterile extraction buffer',
      'Vortex for 2 minutes',
      'Centrifuge at 5000 rpm for 10 minutes',
      'Collect supernatant for DNA extraction',
      'Perform PCR amplification of 16S rRNA',
      'Analyze using gel electrophoresis'
    ],
    createdBy: '1',
    createdAt: '2024-02-20T00:00:00Z'
  },
  {
    id: 'P003',
    title: 'Plant Tissue DNA Extraction',
    description: 'Standard protocol for extracting DNA from plant tissues',
    category: 'Molecular Biology',
    experimentType: 'Plant Analysis',
    steps: [
      'Collect fresh plant tissue (100mg)',
      'Flash freeze in liquid nitrogen',
      'Grind tissue to fine powder',
      'Add extraction buffer and incubate at 65°C',
      'Add chloroform and centrifuge',
      'Precipitate DNA with isopropanol',
      'Wash pellet with 70% ethanol',
      'Resuspend in TE buffer and quantify'
    ],
    createdBy: '1',
    createdAt: '2024-03-10T00:00:00Z'
  }
];

export const mockNotifications: Notification[] = [
  {
    id: 'N001',
    userId: '2',
    title: 'Sample Analysis Complete',
    message: 'Analysis for sample WTR-2025-001 has been completed',
    type: 'sample',
    read: false,
    createdAt: '2025-10-11T16:30:00Z'
  },
  {
    id: 'N002',
    userId: '2',
    title: 'Booking Approved',
    message: 'Your booking request for Oct 15 has been approved',
    type: 'booking',
    read: false,
    createdAt: '2025-10-09T09:00:00Z'
  },
  {
    id: 'N003',
    userId: '3',
    title: 'New Protocol Added',
    message: 'A new protocol "Plant Tissue DNA Extraction" has been added',
    type: 'system',
    read: true,
    createdAt: '2025-03-10T14:00:00Z'
  }
];

export const mockActivityLogs: ActivityLog[] = [
  {
    id: 'A001',
    userId: '2',
    action: 'Sample Created',
    details: 'Created sample WTR-2025-001',
    timestamp: '2025-10-10T09:30:00Z'
  },
  {
    id: 'A002',
    userId: '2',
    action: 'Booking Created',
    details: 'Created booking for Oct 15, 09:00-11:00',
    timestamp: '2025-10-08T10:00:00Z'
  },
  {
    id: 'A003',
    userId: '1',
    action: 'Protocol Added',
    details: 'Added protocol "Plant Tissue DNA Extraction"',
    timestamp: '2024-03-10T14:00:00Z'
  },
  {
    id: 'A004',
    userId: '3',
    action: 'User Registered',
    details: 'New user registered: Emily Johnson',
    timestamp: '2024-03-20T00:00:00Z'
  }
];
