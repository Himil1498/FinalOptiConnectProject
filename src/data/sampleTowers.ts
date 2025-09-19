import { TelecomTower } from '../store/slices/mapSlice';

export const sampleIndianTowers: TelecomTower[] = [
  {
    id: '1',
    name: 'Delhi Tower 1 - CP',
    position: [28.6139, 77.2090], // Connaught Place, Delhi
    type: 'cell',
    status: 'active',
    signal_strength: 95,
    coverage_radius: 2.5,
    installed_date: '2020-03-15',
    last_maintenance: '2024-01-15',
    equipment: ['5G Base Station', 'Power Amplifier', 'Antenna Array']
  },
  {
    id: '2',
    name: 'Mumbai Tower 1 - BKC',
    position: [19.0760, 72.8777], // Mumbai
    type: 'cell',
    status: 'active',
    signal_strength: 88,
    coverage_radius: 3.0,
    installed_date: '2019-08-22',
    last_maintenance: '2024-02-10',
    equipment: ['4G/5G Base Station', 'Backup Generator', 'Cooling System']
  },
  {
    id: '3',
    name: 'Bangalore Tower 1 - Electronic City',
    position: [12.9716, 77.5946], // Bangalore
    type: 'fiber',
    status: 'active',
    signal_strength: 92,
    coverage_radius: 1.8,
    installed_date: '2021-01-10',
    last_maintenance: '2024-01-20',
    equipment: ['Fiber Hub', 'Optical Amplifier', 'Patch Panel']
  },
  {
    id: '4',
    name: 'Chennai Tower 1 - OMR',
    position: [13.0827, 80.2707], // Chennai
    type: 'cell',
    status: 'maintenance',
    signal_strength: 75,
    coverage_radius: 2.2,
    installed_date: '2020-06-05',
    last_maintenance: '2024-02-25',
    equipment: ['4G Base Station', 'Battery Backup', 'Lightning Protection']
  },
  {
    id: '5',
    name: 'Kolkata Tower 1 - Salt Lake',
    position: [22.5726, 88.3639], // Kolkata
    type: 'radio',
    status: 'active',
    signal_strength: 90,
    coverage_radius: 4.0,
    installed_date: '2019-11-18',
    last_maintenance: '2024-01-08',
    equipment: ['Microwave Radio', 'Parabolic Antenna', 'Frequency Converter']
  },
  {
    id: '6',
    name: 'Hyderabad Tower 1 - HITEC City',
    position: [17.3850, 78.4867], // Hyderabad
    type: 'cell',
    status: 'active',
    signal_strength: 94,
    coverage_radius: 2.8,
    installed_date: '2020-09-12',
    last_maintenance: '2024-02-05',
    equipment: ['5G Base Station', 'Smart Antenna', 'Remote Monitoring Unit']
  },
  {
    id: '7',
    name: 'Pune Tower 1 - Hinjewadi',
    position: [18.5204, 73.8567], // Pune
    type: 'fiber',
    status: 'active',
    signal_strength: 89,
    coverage_radius: 1.5,
    installed_date: '2021-05-20',
    last_maintenance: '2024-02-18',
    equipment: ['Fiber Node', 'DWDM Equipment', 'Splice Enclosure']
  },
  {
    id: '8',
    name: 'Ahmedabad Tower 1 - SG Highway',
    position: [23.0225, 72.5714], // Ahmedabad
    type: 'cell',
    status: 'critical',
    signal_strength: 60,
    coverage_radius: 1.8,
    installed_date: '2018-12-03',
    last_maintenance: '2023-11-15',
    equipment: ['4G Base Station', 'Backup Power', 'Cooling Fan']
  },
  {
    id: '9',
    name: 'Gurgaon Tower 1 - Cyber City',
    position: [28.4595, 77.0266], // Gurgaon
    type: 'cell',
    status: 'active',
    signal_strength: 91,
    coverage_radius: 2.3,
    installed_date: '2020-07-25',
    last_maintenance: '2024-01-30',
    equipment: ['5G Base Station', 'Massive MIMO', 'Edge Computing Unit']
  },
  {
    id: '10',
    name: 'Kochi Tower 1 - InfoPark',
    position: [10.0261, 76.3125], // Kochi
    type: 'satellite',
    status: 'active',
    signal_strength: 85,
    coverage_radius: 15.0,
    installed_date: '2019-04-14',
    last_maintenance: '2024-02-12',
    equipment: ['Satellite Dish', 'LNB', 'Modem', 'Tracking System']
  },
  {
    id: '11',
    name: 'Noida Tower 1 - Sector 62',
    position: [28.6139, 77.3910], // Noida
    type: 'fiber',
    status: 'active',
    signal_strength: 93,
    coverage_radius: 2.0,
    installed_date: '2021-02-28',
    last_maintenance: '2024-02-20',
    equipment: ['Fiber Distribution Hub', 'OLT', 'Power Supply Unit']
  },
  {
    id: '12',
    name: 'Jaipur Tower 1 - Malviya Nagar',
    position: [26.9124, 75.7873], // Jaipur
    type: 'cell',
    status: 'inactive',
    signal_strength: 0,
    coverage_radius: 2.5,
    installed_date: '2019-10-08',
    last_maintenance: '2023-12-10',
    equipment: ['4G Base Station', 'Antenna', 'Power Amplifier']
  }
];