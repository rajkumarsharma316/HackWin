import { render, screen } from '@testing-library/react';
import Navbar from '../src/components/Navbar';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

// Mock the freighter lib
jest.mock('../src/lib/freighter', () => ({
  connectWallet: jest.fn(),
  getPublicKey: jest.fn(() => Promise.resolve(null)),
  shortenAddress: jest.fn((addr) => addr.substring(0, 4) + '...' + addr.substring(addr.length - 4)),
}));

describe('Navbar Component', () => {
  it('renders the brand name', () => {
    render(<Navbar />);
    expect(screen.getByText('HackWin')).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    render(<Navbar />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Winners')).toBeInTheDocument();
    expect(screen.getByText('Verify')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('renders the Connect Wallet button initially', () => {
    render(<Navbar />);
    // There are two buttons (desktop and mobile), so we can use getAllByRole or getAllByText
    const connectButtons = screen.getAllByText('🔗 Connect Wallet');
    expect(connectButtons.length).toBeGreaterThan(0);
  });
});
