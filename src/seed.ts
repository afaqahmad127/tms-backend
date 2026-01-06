import 'dotenv/config';
import mongoose from 'mongoose';
import { User, UserRole } from './models/User';
import { Shipment, ShipmentStatus, ShipmentPriority, ShipmentType } from './models/Shipment';

const carriers = ['FedEx', 'UPS', 'DHL', 'USPS', 'Amazon Logistics', 'OnTrac', 'LaserShip'];
const cities = [
  { city: 'New York', state: 'NY', zip: '10001' },
  { city: 'Los Angeles', state: 'CA', zip: '90001' },
  { city: 'Chicago', state: 'IL', zip: '60601' },
  { city: 'Houston', state: 'TX', zip: '77001' },
  { city: 'Phoenix', state: 'AZ', zip: '85001' },
  { city: 'Philadelphia', state: 'PA', zip: '19101' },
  { city: 'San Antonio', state: 'TX', zip: '78201' },
  { city: 'San Diego', state: 'CA', zip: '92101' },
  { city: 'Dallas', state: 'TX', zip: '75201' },
  { city: 'San Jose', state: 'CA', zip: '95101' },
  { city: 'Austin', state: 'TX', zip: '78701' },
  { city: 'Seattle', state: 'WA', zip: '98101' },
  { city: 'Denver', state: 'CO', zip: '80201' },
  { city: 'Boston', state: 'MA', zip: '02101' },
  { city: 'Miami', state: 'FL', zip: '33101' }
];

const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
const streets = ['Main St', 'Oak Ave', 'Maple Dr', 'Cedar Ln', 'Pine Rd', 'Elm St', 'Washington Blvd', 'Park Ave', 'Lake Dr', 'Forest Way'];

const descriptions = [
  'Electronics - Laptop computers',
  'Fragile - Glassware set',
  'Furniture - Office desk',
  'Clothing - Winter collection',
  'Medical supplies - First aid kits',
  'Books - Educational materials',
  'Automotive parts - Engine components',
  'Home appliances - Kitchen equipment',
  'Sports equipment - Gym machines',
  'Cosmetics - Beauty products',
  'Food items - Non-perishable goods',
  'Industrial tools - Power equipment',
  'Textiles - Fabric rolls',
  'Jewelry - Precious metals',
  'Artwork - Framed paintings'
];

const getRandomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const getRandomNumber = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomFloat = (min: number, max: number): number => Math.round((Math.random() * (max - min) + min) * 100) / 100;

const generatePhoneNumber = (): string => {
  const area = getRandomNumber(200, 999);
  const exchange = getRandomNumber(200, 999);
  const subscriber = getRandomNumber(1000, 9999);
  return `(${area}) ${exchange}-${subscriber}`;
};

const generateEmail = (firstName: string, lastName: string): string => {
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'company.com'];
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${getRandomElement(domains)}`;
};

const generateAddress = () => {
  const cityData = getRandomElement(cities);
  const firstName = getRandomElement(firstNames);
  const lastName = getRandomElement(lastNames);
  
  return {
    street: `${getRandomNumber(100, 9999)} ${getRandomElement(streets)}`,
    city: cityData.city,
    state: cityData.state,
    zipCode: cityData.zip,
    country: 'USA',
    contactName: `${firstName} ${lastName}`,
    contactPhone: generatePhoneNumber(),
    contactEmail: generateEmail(firstName, lastName)
  };
};

const generateTrackingNumber = (): string => {
  const prefix = 'TMS';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

const seed = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tms';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Shipment.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Create admin user
    const admin = new User({
      email: 'admin@tms.com',
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      department: 'Management'
    });
    await admin.save();
    console.log('👤 Created admin user: admin@tms.com / admin123');

    // Create employee user
    const employee = new User({
      email: 'employee@tms.com',
      password: 'employee123',
      firstName: 'John',
      lastName: 'Employee',
      role: UserRole.EMPLOYEE,
      department: 'Operations'
    });
    await employee.save();
    console.log('👤 Created employee user: employee@tms.com / employee123');

    // Create additional employees with unique emails
    const additionalEmployees = [];
    for (let i = 0; i < 5; i++) {
      const firstName = getRandomElement(firstNames);
      const lastName = getRandomElement(lastNames);
      const uniqueId = Date.now().toString(36) + i;
      const emp = new User({
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${uniqueId}@tms.com`,
        password: 'password123',
        firstName,
        lastName,
        role: UserRole.EMPLOYEE,
        department: getRandomElement(['Operations', 'Logistics', 'Customer Service', 'Dispatch'])
      });
      additionalEmployees.push(emp);
    }
    await User.insertMany(additionalEmployees);
    console.log(`👥 Created ${additionalEmployees.length} additional employees`);

    // Create shipments
    const statuses = Object.values(ShipmentStatus);
    const priorities = Object.values(ShipmentPriority);
    const types = Object.values(ShipmentType);
    const userIds = [admin._id, employee._id];

    const shipments = [];
    for (let i = 0; i < 150; i++) {
      const status = getRandomElement(statuses);
      const createdDate = new Date();
      createdDate.setDate(createdDate.getDate() - getRandomNumber(0, 60));
      
      const estimatedDelivery = new Date(createdDate);
      estimatedDelivery.setDate(estimatedDelivery.getDate() + getRandomNumber(1, 14));

      let actualDelivery;
      if (status === ShipmentStatus.DELIVERED) {
        actualDelivery = new Date(estimatedDelivery);
        actualDelivery.setDate(actualDelivery.getDate() + getRandomNumber(-2, 3));
      }

      const isFlagged = Math.random() < 0.1; // 10% flagged

      const shipment = {
        trackingNumber: generateTrackingNumber(),
        status,
        priority: getRandomElement(priorities),
        type: getRandomElement(types),
        origin: generateAddress(),
        destination: generateAddress(),
        weight: getRandomFloat(0.5, 500),
        dimensions: {
          length: getRandomFloat(5, 100),
          width: getRandomFloat(5, 100),
          height: getRandomFloat(5, 100)
        },
        description: getRandomElement(descriptions),
        specialInstructions: Math.random() < 0.3 ? 'Handle with care. Fragile contents.' : undefined,
        carrier: getRandomElement(carriers),
        estimatedDelivery,
        actualDelivery,
        cost: getRandomFloat(15, 2500),
        insurance: Math.random() < 0.5 ? getRandomFloat(50, 500) : 0,
        isFlagged,
        flagReason: isFlagged ? 'Requires additional verification' : undefined,
        assignedDriver: Math.random() < 0.7 ? `Driver-${getRandomNumber(100, 999)}` : undefined,
        vehicleId: Math.random() < 0.7 ? `VH-${getRandomNumber(1000, 9999)}` : undefined,
        createdBy: getRandomElement(userIds),
        lastUpdatedBy: getRandomElement(userIds),
        createdAt: createdDate,
        updatedAt: new Date()
      };

      shipments.push(shipment);
    }

    await Shipment.insertMany(shipments);
    console.log(`📦 Created ${shipments.length} shipments`);

    // Print stats
    const stats = await Shipment.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    console.log('\n📊 Shipment Statistics:');
    stats.forEach(s => console.log(`   ${s._id}: ${s.count}`));

    console.log('\n✅ Seed completed successfully!');
    console.log('\n🔑 Login Credentials:');
    console.log('   Admin: admin@tms.com / admin123');
    console.log('   Employee: employee@tms.com / employee123\n');

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seed();

