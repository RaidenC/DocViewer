import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SearchableSelect from './SearchableSelect';

describe('SearchableSelect', () => {
  const mockOptions = [
    { value: 'xyz-motors', label: 'XYZ Motors' },
    { value: 'smith-family', label: 'Smith Family Trust' },
    { value: 'fleet-solutions', label: 'Fleet Solutions Inc' },
  ];

  const defaultProps = {
    label: 'Client',
    options: mockOptions,
    value: '',
    onChange: vi.fn(),
    placeholder: 'Search clients...',
  };

  it('should render trigger button with label and All when no value selected', () => {
    render(<SearchableSelect {...defaultProps} />);
    expect(screen.getByText('Client: All')).toBeDefined();
  });

  it('should show selected value in trigger button', () => {
    render(<SearchableSelect {...defaultProps} value="xyz-motors" />);
    expect(screen.getByText('Client: XYZ Motors')).toBeDefined();
  });

  it('should open dropdown when clicked', () => {
    render(<SearchableSelect {...defaultProps} />);
    const button = screen.getByText('Client: All');
    fireEvent.click(button);
    expect(screen.getByPlaceholderText('Search clients...')).toBeDefined();
    expect(screen.getByText('XYZ Motors')).toBeDefined();
  });

  it('should filter options based on search input', () => {
    render(<SearchableSelect {...defaultProps} />);
    const button = screen.getByText('Client: All');
    fireEvent.click(button);

    const searchInput = screen.getByPlaceholderText('Search clients...');
    fireEvent.change(searchInput, { target: { value: 'xyz' } });

    expect(screen.getByText('XYZ Motors')).toBeDefined();
    expect(screen.queryByText('Smith Family Trust')).toBeNull();
    expect(screen.queryByText('Fleet Solutions Inc')).toBeNull();
  });

  it('should call onChange when option is selected', () => {
    const onChange = vi.fn();
    render(<SearchableSelect {...defaultProps} onChange={onChange} />);

    const button = screen.getByText('Client: All');
    fireEvent.click(button);

    const option = screen.getByText('XYZ Motors');
    fireEvent.click(option);

    expect(onChange).toHaveBeenCalledWith('xyz-motors');
  });

  it('should deselect when clicking already selected option', () => {
    const onChange = vi.fn();
    render(<SearchableSelect {...defaultProps} value="xyz-motors" onChange={onChange} />);

    const button = screen.getByText('Client: XYZ Motors');
    fireEvent.click(button);

    const option = screen.getByText('XYZ Motors');
    fireEvent.click(option);

    expect(onChange).toHaveBeenCalledWith('');
  });

  it('should show "No results" when search has no matches', () => {
    render(<SearchableSelect {...defaultProps} />);
    const button = screen.getByText('Client: All');
    fireEvent.click(button);

    const searchInput = screen.getByPlaceholderText('Search clients...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

    expect(screen.getByText('No results')).toBeDefined();
  });

  it('should close dropdown and clear search when clicking outside', () => {
    render(
      <div>
        <div data-testid="outside">Outside</div>
        <SearchableSelect {...defaultProps} />
      </div>
    );

    const button = screen.getByText('Client: All');
    fireEvent.click(button);

    expect(screen.getByPlaceholderText('Search clients...')).toBeDefined();

    const outside = screen.getByTestId('outside');
    fireEvent.mouseDown(outside);

    expect(screen.queryByPlaceholderText('Search clients...')).toBeNull();
  });

  it('should display all options when search is empty', () => {
    render(<SearchableSelect {...defaultProps} />);
    const button = screen.getByText('Client: All');
    fireEvent.click(button);

    expect(screen.getByText('XYZ Motors')).toBeDefined();
    expect(screen.getByText('Smith Family Trust')).toBeDefined();
    expect(screen.getByText('Fleet Solutions Inc')).toBeDefined();
  });
});