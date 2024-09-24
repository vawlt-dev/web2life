import React from 'react'
import styles from './EventWrapper.module.css';
export const EventWrapper = (props) => 
{
    console.log(props)
    console.log(props.style)
    return (
        <div 
            className={styles.eventWrapper}
            style=
            {
                {
                    height: `${props.style.height}%`,
                    width: `${props.style.width}%`,
                    top: `${props.style.top}%`,
                }
                
            }
            >
               
                {props.event.title}
            </div>
    )
}
