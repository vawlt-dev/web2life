import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import styles from './App.module.css';

export const App = () =>
{
    return (
        <div id={styles.mainWrap}>
            <FullCalendar 
                plugins = {[dayGridPlugin]}
                initialView = "dayGridMonth"
                weekends = {false}
                headerToolbar =
                {
                    { 
                        left: null,
                        center: 'title'
                    }
                }
                viewClassNames={styles.calendarView}
                dayHeaderClassNames =
                {
                    styles.calendarHeader
                }
            />

            
        </div>
    );
}