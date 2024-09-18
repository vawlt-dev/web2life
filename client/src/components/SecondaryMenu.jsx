import React, { useRef, useState } from 'react'
import styles from './SecondaryMenu.module.css'
import { Calendar } from 'react-big-calendar'

export const SecondaryMenu = ({localizer, calendarFunctions}) => 
{
    const dropdownRef = useRef(null);
    const [checkboxes, setCheckboxes] = useState
    (
        {
            localEvents: true,
            importedEvents: true,
            googleEvents: true,
            microsoftEvents: true,
            githubEvents: true,
            slackEvents: true,
            gitlabEvents: true,
        }
    );

    const handleCheckboxClick = (e) =>
    {
        if(e.target.name === "importedEvents" && !e.target.checked)
        {
            setCheckboxes( prevState => 
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
        setCheckboxes(prevState => (
            {
                ...prevState,
                [e.target.name]: e.target.checked 
            })
        )
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
                                                        let tempDate = new Date(calendarFunctions.date);
                                                        tempDate.setMonth(tempDate.getMonth() - 1);
                                                        calendarFunctions.setDate(tempDate);

                                                    }}>🢐</button> 

                                                    <button onClick={() =>
                                                    {
                                                        let tempDate = new Date(calendarFunctions.date);
                                                        tempDate.setMonth(tempDate.getMonth() + 1);
                                                        calendarFunctions.setDate(tempDate);
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
                    Filter
                </div>
                <div id={styles.filterDropdown} ref={dropdownRef}>
                    <span>
                        <text>Local Events</text>
                        <input type='checkbox'
                            name='localEvents'
                            checked={checkboxes.localEvents}
                            onChange={handleCheckboxClick}
                        />
                    </span>
                    <span>
                        <text>Imported Events</text>
                        <input type='checkbox'
                            name='importedEvents'
                            checked={checkboxes.importedEvents}
                            onChange={handleCheckboxClick}
                        />
                    </span>
                    <div id={styles.importedEventsOptions}>
                        <span>
                            <text>- Google Events</text>
                            <input type='checkbox'
                                name='googleEvents'
                                checked={checkboxes.googleEvents}
                                onChange={handleCheckboxClick}
                            />
                        </span>
                        <span>
                            <text>- Microsoft Events</text>
                            <input type='checkbox'
                                name='microsoftEvents'
                                checked={checkboxes.microsoftEvents}
                                onChange={handleCheckboxClick}
                            />
                        </span>
                        <span>
                            <text>- Github Events</text>
                            <input type='checkbox'
                                name='githubEvents'
                                checked={checkboxes.githubEvents}
                                onChange={handleCheckboxClick}
                            />
                        </span>
                        <span>
                            <text>- Slack Events</text>
                            <input type='checkbox'
                                name='slackEvents'
                                checked={checkboxes.slackEvents}
                                onChange={handleCheckboxClick}
                            />
                        </span>
                        <span>
                            <text>- GitLab Events</text>
                            <input type='checkbox'
                                name='gitlabEvents'
                                checked={checkboxes.gitlabEvents}
                                onChange={handleCheckboxClick}
                            />
                        </span>
                    </div>
                </div>
                
            </div>
        </div>
    )
}
