import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import styles from "./App.module.css";

export const App = () =>
{
    return (
        <div id={styles.mainWrap}>
            <FullCalendar 
                allDayClassNames={styles.slot}
                plugins = {[dayGridPlugin]}
                initialView = "dayGridMonth"
                weekends = {false}
                headerToolbar =
                {
                    { 
                        left: "title",
                        right: "prevYear prev today dayGridDay dayGridMonth next nextYear",
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