import React from 'react';

import {render, screen, fireEvent} from '@testing-library/react'
import test, { describe, it } from 'node:test';
import { AppCalendar } from './components/AppCalendar';

describe("Event Creation", () =>
{   
    render(<AppCalendar/>)
    
    fireEvent.click(AppCalendar)
})