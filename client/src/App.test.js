import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act, useState } from 'react'; // Importing from 'react' instead of 'react-dom/test-utils'
import { AppCalendar } from './components/AppCalendar';
import { momentLocalizer, Views } from 'react-big-calendar';
import '@testing-library/jest-dom';
import moment from 'moment';

const mockCalendarFunctions = 
{
    onNavigate: jest.fn(),
    onView: jest.fn(),
    view: Views.WEEK,
    date: new Date(),
};
             
const mockWebFunctions =
{
    putEvent: jest.fn(),
    patchEvent: jest.fn()
}

const localizer = momentLocalizer(moment);

const TestCalendar = () => 
{
    const [mockEvents, setMockEvents] = useState([]); 
    const [mockProjects, setMockProjects] = useState([]);

    return (
        <AppCalendar 
            calRef={null}
            events={mockEvents}
            setEvents={setMockEvents}
            projects={mockProjects}
            webFunctions={mockWebFunctions}
            defaultDate={new Date()}
            calendarFunctions={mockCalendarFunctions}
            localizer={localizer}
        />
    );
};   

test("should create a temporary event when a slot is clicked", async () => {
    let { container } =  render (<TestCalendar/>)

    const slots = screen.getAllByTestId('slot');    
    expect(slots.length).toBeGreaterThan(0);
    fireEvent.click(slots[0])
    await waitFor(() =>
    {
        expect(screen.getAllByTestId('event')).toBeGreaterThan(0)
    })
});