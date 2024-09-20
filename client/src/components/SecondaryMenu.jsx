import React, { useEffect, useRef, useState } from 'react'
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
        setCheckboxes(prevState => (
            {
                ...prevState,
                [e.target.name]: e.target.checked 
            })
        )
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
        else if(e.target.name === "importedEvents" && e.target.checked)
        {
            setCheckboxes(prevState =>
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
        setCheckboxes(prevState => 
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
                    Filter Events
                </div>
                <div id={styles.filterDropdown} className={`${styles.active}`} ref={dropdownRef}>
                    <span>
                        <text className={checkboxes.localEvents ? `${styles.active}` : ''}>Local Events</text>
                        <input type='checkbox'
                            name='localEvents'
                            checked={checkboxes.localEvents}
                            onChange={handleCheckboxClick}
                        />
                    </span>
                    <span>
                        <text className={checkboxes.importedEvents ? `${styles.active}` : ''}>Imported Events</text>
                        <input type='checkbox'
                            name='importedEvents'
                            checked={checkboxes.importedEvents}
                            onChange={handleCheckboxClick}
                        />
                    </span>
                    <div id={styles.importedEventsOptions}>
                        <span>
                            <text className={checkboxes.googleEvents ? `${styles.active}` : ''}>- Google Events</text>
                            <input type='checkbox'
                                name='googleEvents'
                                checked={checkboxes.googleEvents}
                                onChange={handleCheckboxClick}
                            />
                        </span>
                        <span>
                            <text className={checkboxes.microsoftEvents ? `${styles.active}` : ''}>- Microsoft Events</text>
                            <input type='checkbox'
                                name='microsoftEvents'
                                checked={checkboxes.microsoftEvents}
                                onChange={handleCheckboxClick}
                            />
                        </span>
                        <span>
                            <text className={checkboxes.githubEvents ? `${styles.active}` : ''}>- Github Events</text>
                            <input type='checkbox'
                                name='githubEvents'
                                checked={checkboxes.githubEvents}
                                onChange={handleCheckboxClick}
                            />
                        </span>
                        <span>
                            <text className={checkboxes.slackEvents ? `${styles.active}` : ''}>- Slack Events</text>
                            <input type='checkbox'
                                name='slackEvents'
                                checked={checkboxes.slackEvents}
                                onChange={handleCheckboxClick}
                            />
                        </span>
                        <span>
                            <text className={checkboxes.gitlabEvents ? `${styles.active}` : ''}>- GitLab Events</text>
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
