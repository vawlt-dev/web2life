import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin, { Draggable } from "@fullcalendar/interaction"
import styles from "./App.module.css";
import { useEffect, useRef } from "react";

export const App = () =>
{
    const calRef = useRef(null);
    const dragRef = useRef(null);
    useEffect( () =>
    {
        // for the outer calendar wrapper
        calRef.current.elRef.current.id = styles.calendar
    }, [calRef]) 

    //useEffect to ensure app re-renders when references are set
    useEffect( () =>
    {
        if(dragRef.current)
        {
            const dragInstance = new Draggable(dragRef.current, 
            {
                eventData: () => 
                (
                    {
                        title: "An event",
                        extendedProps:
                        {
                            //add whatever other data here
                        }
                           
                    }
                )
            });
            return () =>
            {
                // cleanup code for destructor of draggable object, two events spawn otherwise
                dragInstance.destroy()
            }
        }
    }, [])

    return (
        <div id={styles.mainWrap}>
        <div ref={dragRef} className={styles.externalDraggable} draggable={true}>
            Test Event
        </div>

        <FullCalendar
            ref={calRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            weekends={false}
        
            headerToolbar =
            {
                {
                    left: "title",
                    right: "prevYear prev timeGridDay today dayGridMonth next nextYear",
                }
            }

            dayHeaderClassNames={styles.calendarHeader}
            viewClassNames={styles.calView}
            slotMinTime="08:00:00"
            slotDuration="00:15:00"
            slotMaxTime="18:15:00"
            dayCellClassNames={styles.monthCells}

            events = { [] }
            editable = { true }
            droppable = { true }
            eventReceive =
            {   
                (info) =>
                {
                }
            }
            dateClick = 
            {
                (info) => 
                {
                    //clicking on a day of month cell takes user to day view of that day
                    calRef.current.elRef.current.animate(
                        [
                            {opacity: 1},
                            {opacity: 0},
                            {opacity: 1},
                        ],
                        {
                            duration: 750,
                            easing: "ease-in-out"
                        }
                    )
                    setTimeout(() => {
                        info.view.calendar.changeView('timeGridDay', info.dateStr)
                        
                    }, 375); // half duration time so switch triggers on centre keyframe
                }
            } 
        />
    </div>
  );
}