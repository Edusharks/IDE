export const ideTutorials = [
  {
    id: 'introduction',
    type: 'hardware',
    title: 'Welcome to the IDE',
    description: 'A quick tour of the main features: the toolbox, workspace, and how to connect to your device.',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v15H6.5A2.5 2.5 0 0 1 4 14.5v-11A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
    steps: [
      {
        id: 'intro-1',
        title: 'Welcome!',
        text: 'This short tour will introduce you to the main parts of the interface.',
        attachTo: { element: '#project-title-wrapper', on: 'bottom' },
        buttons: [{ text: 'Next', action() { return this.next(); }}]
      },
      {
        id: 'intro-2',
        title: 'The Toolbox',
        text: 'This is the Toolbox. It contains all the code blocks, organized by category. Click a category to see its blocks.',
        attachTo: { element: '.blocklyToolboxDiv', on: 'right' },
        buttons: [
          { text: 'Back', classes: 'shepherd-button-secondary', action() { return this.back(); }},
          { text: 'Next', action() { return this.next(); }}
        ]
      },
      {
        id: 'intro-3',
        title: 'The Workspace',
        text: 'Drag blocks from the Toolbox and drop them here to build your program. The "on start" and "forever" blocks are the foundation of your code.',
        attachTo: { element: '#blocklyArea', on: 'top' },
        buttons: [
          { text: 'Back', classes: 'shepherd-button-secondary', action() { return this.back(); }},
          { text: 'Next', action() { return this.next(); }}
        ]
      },
      {
        id: 'intro-4',
        title: 'Device Connection',
        text: 'Use this menu to connect to your ESP32 or Pico via USB or Wi-Fi.',
        attachTo: { element: '.connection-container', on: 'top' },
        buttons: [
          { text: 'Back', classes: 'shepherd-button-secondary', action() { return this.next(); }},
          { text: 'Next', action() { return this.next(); }}
        ]
      },
      {
        id: 'intro-5',
        title: 'Upload Code',
        text: 'Once you are connected and your code is ready, click this button to upload it to your device.',
        attachTo: { element: '#upload-code', on: 'top' },
        buttons: [
          { text: 'Back', classes: 'shepherd-button-secondary', action() { return this.complete(); }}
        ]
      }
    ]
  },
  {
    id: 'device-connection',
    type: 'hardware',
    title: 'Connecting Your Device',
    description: 'Learn how to connect the IDE to your microcontroller via USB.',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 22v-6M14 22v-6"/><path d="M4 8V4h16v4"/><path d="M6 16h12a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2z"/></svg>`,
    steps: [
      {
        title: 'The Connect Menu',
        text: 'This is the main connection hub. Click the "Connect" button to see the available options.',
        attachTo: { element: '.dropdown', on: 'top' },
        buttons: [{ text: 'Next', action() { return this.next(); }}]
      },
      {
        title: 'Connection Methods',
        text: 'You can connect via USB (recommended for beginners and for setup) or via Wi-Fi if your device is already configured with WebREPL.',
        attachTo: { element: '.dropdown', on: 'top' },
        buttons: [
          { text: 'Back', classes: 'shepherd-button-secondary', action() { return this.back(); }},
          { text: 'Next', action() { return this.next(); }}
        ]
      },
      {
        title: 'Browser Prompt',
        text: 'After clicking "Connect via USB", your browser will show a popup asking you to select a serial port. Choose your device from the list (it might be named CP210x, USB Serial, etc.) and click Connect.',
        attachTo: { element: '#connect-usb-btn', on: 'top' },
        buttons: [
          { text: 'Back', classes: 'shepherd-button-secondary', action() { return this.back(); }},
          { text: 'Next', action() { return this.next(); }}
        ]
      },
      {
        title: 'Connection Status',
        text: 'Once connected, this indicator will turn green and say "Connected". Now you\'re ready to upload code!',
        attachTo: { element: '#connection-status-wrapper', on: 'top' },
        buttons: [
          { text: 'Back', classes: 'shepherd-button-secondary', action() { return this.back(); }},
          { text: 'Finish', action() { return this.complete(); }}
        ]
      }
    ]
  },
  {
    id: 'using-the-console',
    type: 'hardware',
    title: 'Using the Console',
    description: 'Understand how to send and receive messages from your device for debugging.',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" /></svg>`,
    steps: [
      {
        title: 'Open the Console',
        text: 'Click this button to open the Console view. The console is essential for seeing messages and errors from your device.',
        attachTo: { element: '#console-btn', on: 'bottom' },
        buttons: [{ text: 'Next', action() { return this.next(); }}]
      },
      {
        title: 'Find the Print Block',
        text: 'In the "Communication" category, you will find blocks to print messages. This is the primary way to debug your code.',
        attachTo: { element: 'div[aria-labelledby*="communication_category"]', on: 'right' },
        buttons: [
          { text: 'Back', classes: 'shepherd-button-secondary', action() { return this.back(); }},
          { text: 'Next', action() { return this.next(); }}
        ]
      },
      {
        title: 'Print a Message',
        text: 'Try dragging a "USB Serial print line" block into your "on start" block. Type a message like "Hello, Device!"',
        attachTo: { element: 'g#start_block', on: 'bottom' },
        buttons: [
          { text: 'Back', classes: 'shepherd-button-secondary', action() { return this.back(); }},
          { text: 'Next', action() { return this.next(); }}
        ]
      },
      {
        title: 'Upload and See',
        text: 'After you upload this code, your message will appear in the console! It\'s a great way to check if your code is running or to see sensor values.',
        attachTo: { element: '#upload-code', on: 'top' },
        buttons: [
          { text: 'Back', classes: 'shepherd-button-secondary', action() { return this.back(); }},
          { text: 'Next', action() { return this.next(); }}
        ]
      },
      {
        title: 'Interactive Commands',
        text: 'You can also type Python commands directly into the console input here and press Enter to run them on the device instantly.',
        attachTo: { element: '.console-input-wrapper', on: 'top' },
        buttons: [
          { text: 'Back', classes: 'shepherd-button-secondary', action() { return this.back(); }},
          { text: 'Finish', action() { return this.complete(); }}
        ]
      }
    ]
  },
  {
    id: 'code-and-plotter',
    type: 'hardware',
    title: 'Code & Plotter View',
    description: 'See the Python code your blocks create and visualize sensor data with the live plotter.',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>`,
    steps: [
      {
        title: 'View the Generated Code',
        text: 'Click the "CODE" button to see the real MicroPython code that is generated from your blocks.',
        attachTo: { element: '#code-view-btn', on: 'bottom' },
        buttons: [{ text: 'Next', action() { return this.next(); }}]
      },
      {
        title: 'The Code View',
        text: 'This view is a great way to learn how the blocks translate into text-based programming. You can also copy the code from here.',
        attachTo: { element: '#copy-code-btn', on: 'left' },
        buttons: [
          { text: 'Back', classes: 'shepherd-button-secondary', action() { return this.back(); }},
          { text: 'Next', action() { return this.next(); }}
        ]
      },
      {
        title: 'Return to Blocks',
        text: 'Click here to switch back to the block editor.',
        attachTo: { element: '#blocks-view-btn', on: 'bottom' },
        buttons: [
          { text: 'Back', classes: 'shepherd-button-secondary', action() { return this.back(); }},
          { text: 'Next', action() { return this.next(); }}
        ]
      },
      {
        title: 'The Live Plotter',
        text: 'The Plotter allows you to graph numbers from your device in real-time. It\'s perfect for visualizing sensor data.',
        attachTo: { element: '#plotter-btn', on: 'bottom' },
        buttons: [
          { text: 'Back', classes: 'shepherd-button-secondary', action() { return this.back(); }},
          { text: 'Next', action() { return this.next(); }}
        ]
      },
      {
        title: 'The Plotter Block',
        text: 'In the "Communication" category, find the "plot value" block. This block sends a named value and a color to the plotter.',
        attachTo: { element: 'div[aria-labelledby*="communication_category"]', on: 'right' },
        buttons: [
          { text: 'Back', classes: 'shepherd-button-secondary', action() { return this.back(); }},
          { text: 'Next', action() { return this.next(); }}
        ]
      },
      {
        title: 'Plotting in a Loop',
        text: 'For a continuous graph, place the "plot value" block inside a "forever" loop and connect a sensor block (like "analog read") to its value input.',
        attachTo: { element: 'g#forever_block', on: 'bottom' },
        buttons: [
          { text: 'Back', classes: 'shepherd-button-secondary', action() { return this.back(); }},
          { text: 'Finish', action() { return this.complete(); }}
        ]
      }
    ]
  }
];