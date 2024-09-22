import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react'; // Importing from 'react' instead of 'react-dom/test-utils'
import { AppCalendar } from './components/AppCalendar';
import { momentLocalizer, Views } from 'react-big-calendar';
import '@testing-library/jest-dom';
import moment from 'moment';

const mockCalendarFunctions = {
    addEventFromSecondaryMenu: jest.fn(),
    onNavigate: jest.fn(),
    onView: jest.fn()
};

const mockEvents = [];
const mockProjects = [];
const localizer = momentLocalizer(moment);

const renderCalendar = () =>
{
    // eslint-disable-next-line testing-library/no-unnecessary-act
    return act(() => 
    {
        render
        (
            <AppCalendar 
                calRef={null}
                events={mockEvents}
                setEvents={null}
                projects={mockProjects}
                webFunctions={null}
                defaultDate={new Date()}
                calendarFunctions=
                {
                    { 
                        onNavigate: mockCalendarFunctions.onNavigate,
                        onView: mockCalendarFunctions.onView,
                        view: Views.WEEK,
                        date: new Date(), 
                    }
                }
                localizer={localizer}
            />
        )
    })
    
}

test("should create an event", async () => {
    renderCalendar();

    const slots = screen.getAllByTestId('slot');
    const modal = screen.getByTestId('editModal');

    expect(slots.length).toBeGreaterThan(0);
    expect(modal).toBeInTheDocument();

    fireEvent.click(slots[0]);

    await waitFor(() => {
        const eventTitle = screen.getByPlaceholderText("Add a title");
        expect(eventTitle).toBeInTheDocument();
    });

    const eventTitle = screen.getByPlaceholderText("Add a title");
    const eventStart = screen.getByLabelText("Start Time");
    const eventEnd = screen.getByLabelText("End Time");
    const eventDescription = screen.getByLabelText("Description");
    const submitButton = screen.getByText("Save");

    fireEvent.change(eventTitle, { target: { value: 'Test Event' }});
    fireEvent.change(eventStart, { target: { value: new Date().toISOString().slice(0, 16) }});
    fireEvent.change(eventEnd, { target: { value: new Date().toISOString().slice(0, 16) }});
    fireEvent.change(eventDescription, { target: { value: 'Test Description' }});


    fireEvent.click(submitButton)
});