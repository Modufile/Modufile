export const notices: {
    id: string;
    active: boolean;
    message: string;
    type: 'info' | 'warning' | 'error' | 'success';
    dismissible: boolean;
}[] = [
        {
            id: 'construction-notice-001',
            active: true,
            message: "Tool under construction. Launching March 20, 2026. Code will be open sourced under AGPL license. Current version is for testing purposes only.",
            type: 'warning',
            dismissible: true,
        }
    ];
