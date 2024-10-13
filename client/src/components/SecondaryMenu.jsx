import React, { useRef } from 'react'
import styles from './SecondaryMenu.module.css'
import { Calendar } from 'react-big-calendar'

const hexToRgb = (colour) =>
{
    let r = parseInt(colour.slice(1, 3), 16);
    let g = parseInt(colour.slice(3, 5), 16);
    let b = parseInt(colour.slice(5, 7), 16);
    return { r, g, b };
}

export const SecondaryMenu = (
    {
        localizer, 
        calendarFunctions, 
        filteringFunctions, 
        notifications, 
        colours
    }) => 
{
    const dropdownRef = useRef(null);
    
    const handleCheckboxClick = (e) =>
    {
        filteringFunctions.setActiveEvents(prevState => (
            {
                ...prevState,
                [e.target.name]: e.target.checked 
            })
        )
        if(e.target.name === "importedEvents" && !e.target.checked)
        {
            filteringFunctions.setActiveEvents( prevState => 
                ({
                    ...prevState,
                    importedEvents: false,
                    googleEvents: false,
                    microsoftEvents: false,
                    githubEvents: false,
                    slackEvents: false,
                    gitlabEvents: false,
                })
            )
        }
        else if(e.target.name === "importedEvents" && e.target.checked)
        {
            filteringFunctions.setActiveEvents(prevState =>
            ({
                ...prevState,
                importedEvents: true,
                googleEvents: true,
                microsoftEvents: true,
                githubEvents: true,
                slackEvents: true,
                gitlabEvents: true
            }))
        }
        if (e.target.name !== 'importedEvents' && e.target.name !== 'localEvents') {
        filteringFunctions.setActiveEvents(prevState => 
        {
            const importedEventOptionsAreUnchecked = Object.entries(prevState).every(([key, value]) => 
            {
                if (key !== 'importedEvents' && key !== 'localEvents') 
                {
                    return value === false;
                }
                return true;
            });

            if (importedEventOptionsAreUnchecked) 
            {
                return {
                    ...prevState,
                    [e.target.name]: e.target.checked,
                    importedEvents: false
                };
            }
            if (!prevState.importedEvents && e.target.checked) 
            {
                return {
                    ...prevState,
                    [e.target.name]: e.target.checked, 
                    importedEvents: true
                };
            }
            return {
                ...prevState,
                [e.target.name]: e.target.checked
            };
        });
    }
        
    }
    return (
        <div id={styles.menuWrap}>

            <div id={styles.addEventWrap}>
                <label>
                    Create an Event 
                </label>
                <div id={styles.addEventButton}>
                    <button onClick={() => calendarFunctions.addEventFromSecondaryMenu()}>+</button>
                </div>
            </div>
            <div id={styles.addEventWrap}>
                <label>
                    Save as Template 
                </label>
                <div id={styles.addEventButton}>
                    <button onClick={() => calendarFunctions.createTemplate()}>+</button>
                </div>
            </div>


            <div id={styles.secondaryCalendarWrap}>
                <Calendar 
                    components =
                    {
                        {
                            header: (props) => <div>{props.label.substring(0,1)}</div>,
                            toolbar: (props) => 
                                            <div id={styles.secondaryCalendarToolbar}> 
                                                {props.label} 
                                                <div>
                                                    <button onClick={ () => 
                                                    { 
                                                        calendarFunctions.handleNavigate("back")

                                                    }}>🢐</button> 

                                                    <button onClick={() =>
                                                    {
                                                          calendarFunctions.handleNavigate("next")
                                                    }}>🢒</button>
                                                </div>
                                            </div>
                        
                        }
                    }
                    date={calendarFunctions.date}
                    localizer={localizer}
                    views={['month']} 
                    onNavigate={(date) => calendarFunctions.setDate(date)}
                    className={styles.secondaryCalendar}/>
                    
            </div>
            <div id={styles.filterWrap}>
                <div id={styles.filterDropdownToggle} onClick={() =>
                {
                    dropdownRef.current.classList.contains(`${styles.active}`) ? dropdownRef.current.classList.remove(`${styles.active}`) : dropdownRef.current.classList.add(`${styles.active}`)
                }}>
                    Filter Events
                </div>
                <div id={styles.filterDropdown} className={`${styles.active}`} ref={dropdownRef}>
                    <span>
                        <label className={filteringFunctions.activeEvents.localEvents ? `${styles.active}` : ''}>Local Events</label>
                        <input type='checkbox'
                            name='localEvents'
                            checked={filteringFunctions.activeEvents.localEvents}
                            onChange={handleCheckboxClick}
                        />
                    </span>
                    <span>
                        <label className={filteringFunctions.activeEvents.importedEvents ? `${styles.active}` : ''}>Imported Events</label>
                        <input type='checkbox'
                            name='importedEvents'
                            checked={filteringFunctions.activeEvents.importedEvents}
                            onChange={handleCheckboxClick}
                        />
                    </span>
                    <div id={styles.importedEventsOptions}>
                        <span>
                            <label className={filteringFunctions.activeEvents.googleEvents ? `${styles.active}` : ''}>- Google Events</label>
                            <input type='checkbox'
                                name='googleEvents'
                                checked={filteringFunctions.activeEvents.googleEvents}
                                onChange={handleCheckboxClick}
                            />
                        </span>
                        <span>
                            <label className={filteringFunctions.activeEvents.microsoftEvents ? `${styles.active}` : ''}>- Microsoft Events</label>
                            <input type='checkbox'
                                name='microsoftEvents'
                                checked={filteringFunctions.activeEvents.microsoftEvents}
                                onChange={handleCheckboxClick}
                            />
                        </span>
                        <span>
                            <label className={filteringFunctions.activeEvents.githubEvents ? `${styles.active}` : ''}>- Github Events</label>
                            <input type='checkbox'
                                name='githubEvents'
                                checked={filteringFunctions.activeEvents.githubEvents}
                                onChange={handleCheckboxClick}
                            />
                        </span>
                        <span>
                            <label className={filteringFunctions.activeEvents.slackEvents ? `${styles.active}` : ''}>- Slack Events</label>
                            <input type='checkbox'
                                name='slackEvents'
                                checked={filteringFunctions.activeEvents.slackEvents}
                                onChange={handleCheckboxClick}
                            />
                        </span>
                        <span>
                            <label className={filteringFunctions.activeEvents.gitlabEvents ? `${styles.active}` : ''}>- GitLab Events</label>
                            <input type='checkbox'
                                name='gitlabEvents'
                                checked={filteringFunctions.activeEvents.gitlabEvents}
                                onChange={handleCheckboxClick}
                            />
                        </span>
                    </div>
                </div>
            </div>

            {/* <div id={styles.notificationsWrap}>
                <label>Notifications</label>
                <div id={styles.notifications}>
                    {
                        notifications?.length > 0 
                        ?
                        (
                            notifications.map((notification, index) => 
                            {
                                //change text colour to black or white if notification colour is greater/lesser than gray
                                const { r, g, b } = hexToRgb(colours?.[notification.source]);
                                let labelColour;
                                if(r > 128 && g > 128 && b > 128)
                                {
                                    labelColour = 'black'
                                }
                                else
                                {
                                    labelColour = 'white'
                                }

                                if (notification.source === 'slack')
                                {
                                    return (
                                        <div 
                                            key={index} 
                                            className={styles.notification} 
                                            style={{backgroundColor: colours?.[notification.source]}}
                                        >
                                            <label style={{color: labelColour}}>
                                                Date: {notification.date}
                                            </label>
                                            <label style={{color: labelColour}}>
                                                Channel: {notification.channel}
                                            </label>
                                            <label style={{color: labelColour}}>
                                                User: {notification.user}
                                            </label>
                                        </div>
                                    );
                                    

                                }
                                else return(
                                    <div 
                                        key={index} 
                                        className={styles.notification} 
                                        style={{backgroundColor: colours?.[notification.source]}}
                                    >
                                        <label style={{color: labelColour}}>
                                            Date: {notification.date}
                                        </label>
                                        <label style={{color: labelColour}}>
                                            To: {notification.recipient}
                                        </label>
                                        <label style={{color: labelColour}}>
                                            Subject: {notification.subject}
                                        </label>

                                    </div>
                                )
                            }
                        ))                        
                        :
                        <div className={styles.notification}>
                            <label id={styles.noNotifications}>No notifications</label>
                        </div>
                    }
                </div>
            </div> */}
        </div>
    )
}

