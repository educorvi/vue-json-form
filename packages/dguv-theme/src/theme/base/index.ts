import type { AuraBaseDesignTokens } from '@primeuix/themes/aura/base';

/**
 * UV Nexus PrimeVue Theme Preset
 *
 * Corporate design system preset for PrimeVue.
 *
 * ─── Architecture ────────────────────────────────────────────────────────────
 * Colors are defined ONCE in src/assets/main.css as --uv-* CSS custom
 * properties. This file references them via var(--uv-*) in primitive tokens.
 * PrimeVue then generates --p-{name}-{stop} CSS variables from those, which
 * semantic tokens reference with {name.stop} notation. Tailwind v4 color
 * utilities reach the same uvCSS vars via @theme inline in main.css.
 *
 * ─── UV Color Families ───────────────────────────────────────────────────────
 *   blue   – primary brand (6 stops: 10/20/30/50/60/70)
 *   gray   – neutral surfaces (11 stops: 0/5/10/20/30/50/60/70/80/90/100)
 *   teal   – info (6 stops)
 *   violet – custom/brand accent (6 stops)
 *   green  – success / secondary (6 stops)
 *   red    – error (6 stops)
 *   orange – warning (6 stops)
 *
 *   All 6-stop UV scales are stretched to PrimeVue's 11-stop (50–950) scale.
 *   Stops at the dark end share the UV-70 value (darkest available).
 *
 * ─── Design Decisions ────────────────────────────────────────────────────────
 *   Shape     – Border radius: 0 px everywhere (flat enterprise look)
 *               Exceptions: inputs 1 px, tags 4 px, chips/toggles keep Aura's pill
 *   Focus     – 2 px solid {primary.color} ring, 2 px offset
 *               Form fields use border-color change instead of a ring
 *   Forms     – Padding 0.75 rem × 0.75 rem, min-height 3 rem (48 px)
 *   Shadows   – None (UV elevation system TBD)
 *   Typography– Font-family not set here; import @fontsource/source-sans-3
 *               in main CSS. Label weight: 600 (ref-font-weight-600)
 */

// Utility to map color scales (e.g., uvGreen → green)
function mapColorScales(
    base: Record<string, any>,
    mappings: Record<string, string>
): Record<string, any> {
    const result: Record<string, any> = { ...base };
    for (const [from, to] of Object.entries(mappings)) {
        if (base[from]) {
            result[to] = base[from];
        }
    }
    return result;
}

// Define base color scales only once
const basePrimitives: AuraBaseDesignTokens['primitive'] & Record<string, any> =
    {
        borderRadius: {
            none: '0px',
            xs: '0px',
            sm: '0px',
            md: '0px',
            lg: '0px',
            xl: '0px',
        },
        // DGUV primary = blue (#004994 navy at 70, #4ebfef light blue at 30)
        uvBlue: {
            50: 'var(--ref-color-primary-10)',
            100: 'var(--ref-color-primary-10)',
            200: 'var(--ref-color-primary-20)',
            300: 'var(--ref-color-primary-30)',
            400: 'var(--ref-color-primary-30)',
            500: 'var(--ref-color-primary-50)',
            600: 'var(--ref-color-primary-60)',
            700: 'var(--ref-color-primary-70)',
            800: 'var(--ref-color-primary-70)',
            900: 'var(--ref-color-primary-70)',
            950: 'var(--ref-color-primary-70)',
        },
        // DGUV secondary = green
        uvGreen: {
            50: 'var(--ref-color-secondary-10)',
            100: 'var(--ref-color-secondary-10)',
            200: 'var(--ref-color-secondary-20)',
            300: 'var(--ref-color-secondary-30)',
            400: 'var(--ref-color-secondary-30)',
            500: 'var(--ref-color-secondary-50)',
            600: 'var(--ref-color-secondary-60)',
            700: 'var(--ref-color-secondary-70)',
            800: 'var(--ref-color-secondary-70)',
            900: 'var(--ref-color-secondary-70)',
            950: 'var(--ref-color-secondary-70)',
        },
        // DGUV info = teal
        uvTeal: {
            50: 'var(--ref-color-info-10)',
            100: 'var(--ref-color-info-10)',
            200: 'var(--ref-color-info-20)',
            300: 'var(--ref-color-info-30)',
            400: 'var(--ref-color-info-30)',
            500: 'var(--ref-color-info-50)',
            600: 'var(--ref-color-info-60)',
            700: 'var(--ref-color-info-70)',
            800: 'var(--ref-color-info-70)',
            900: 'var(--ref-color-info-70)',
            950: 'var(--ref-color-info-70)',
        },
        // DGUV custom = violet brand accent
        uvViolet: {
            50: 'var(--ref-color-custom-10)',
            100: 'var(--ref-color-custom-10)',
            200: 'var(--ref-color-custom-20)',
            300: 'var(--ref-color-custom-30)',
            400: 'var(--ref-color-custom-30)',
            500: 'var(--ref-color-custom-50)',
            600: 'var(--ref-color-custom-60)',
            700: 'var(--ref-color-custom-70)',
            800: 'var(--ref-color-custom-70)',
            900: 'var(--ref-color-custom-70)',
            950: 'var(--ref-color-custom-70)',
        },
        // DGUV danger = red
        uvRed: {
            50: 'var(--ref-color-danger-10)',
            100: 'var(--ref-color-danger-10)',
            200: 'var(--ref-color-danger-20)',
            300: 'var(--ref-color-danger-30)',
            400: 'var(--ref-color-danger-30)',
            500: 'var(--ref-color-danger-50)',
            600: 'var(--ref-color-danger-60)',
            700: 'var(--ref-color-danger-70)',
            800: 'var(--ref-color-danger-70)',
            900: 'var(--ref-color-danger-70)',
            950: 'var(--ref-color-danger-70)',
        },
        // DGUV warning = orange
        uvOrange: {
            50: 'var(--ref-color-warning-10)',
            100: 'var(--ref-color-warning-10)',
            200: 'var(--ref-color-warning-20)',
            300: 'var(--ref-color-warning-30)',
            400: 'var(--ref-color-warning-30)',
            500: 'var(--ref-color-warning-50)',
            600: 'var(--ref-color-warning-60)',
            700: 'var(--ref-color-warning-70)',
            800: 'var(--ref-color-warning-70)',
            900: 'var(--ref-color-warning-70)',
            950: 'var(--ref-color-warning-70)',
        },
        // DGUV neutral = grey
        uvGrey: {
            0: 'var(--ref-color-neutral-0)',
            50: 'var(--ref-color-neutral-10)',
            100: 'var(--ref-color-neutral-10)',
            200: 'var(--ref-color-neutral-20)',
            300: 'var(--ref-color-neutral-30)',
            400: 'var(--ref-color-neutral-30)',
            500: 'var(--ref-color-neutral-50)',
            600: 'var(--ref-color-neutral-60)',
            700: 'var(--ref-color-neutral-80)',
            800: 'var(--ref-color-neutral-80)',
            900: 'var(--ref-color-neutral-90)',
            950: 'var(--ref-color-neutral-100)',
        },
    };

// Mapping to map uvColors to colors used in aura theme so manual mapping is not needed
const colorScaleMappings = {
    uvGreen: 'green',
    uvBlue: 'blue',
    uvTeal: 'sky',
    uvViolet: 'purple',
    uvRed: 'red',
    uvOrange: 'orange',
    uvGrey: 'grey',
};

export const primitive: AuraBaseDesignTokens['primitive'] &
    Record<string, any> = mapColorScales(basePrimitives, colorScaleMappings);

export const semantic: AuraBaseDesignTokens['semantic'] = {
    //   transitionDuration: "0.2s",
    focusRing: {
        width: '2px',
        style: 'solid',
        color: '{primary.950}',
        offset: '2px',
        shadow: 'none',
    },
    //   disabledOpacity: "0.6",
    //   iconSize: "1rem",
    //   anchorGutter: "2px",
    /**
     * Primary palette = UV blue.
     * PrimeVue maps primary.500 → --p-primary-color in light mode.
     */
    primary: {
        50: '{uvBlue.50}',
        100: '{uvBlue.100}',
        200: '{uvBlue.200}',
        300: '{uvBlue.300}',
        400: '{uvBlue.400}',
        500: '{uvBlue.500}',
        600: '{uvBlue.600}',
        700: '{uvBlue.700}',
        800: '{uvBlue.800}',
        900: '{uvBlue.900}',
        950: '{uvBlue.950}',
    },
    formField: {
        // paddingX: "0.75rem",
        // paddingY: "0.5rem",
        // sm: {
        //   fontSize: "0.875rem",
        //   paddingX: "0.625rem",
        //   paddingY: "0.375rem",
        // },
        // lg: {
        //   fontSize: "1.125rem",
        //   paddingX: "0.875rem",
        //   paddingY: "0.625rem",
        // },
        // borderRadius: "{border.radius.md}",
        focusRing: {
            width: '2px',
            style: 'solid',
            color: '{primary.950}',
            offset: '2px',
            shadow: 'none',
        },
        // transitionDuration: "{transition.duration}",
    },
    //   list: {
    //     padding: "0.25rem 0.25rem",
    //     gap: "2px",
    //     header: {
    //       padding: "0.5rem 1rem 0.25rem 1rem",
    //     },
    //     option: {
    //       padding: "0.5rem 0.75rem",
    //       borderRadius: "{border.radius.sm}",
    //     },
    //     optionGroup: {
    //       padding: "0.5rem 0.75rem",
    //       fontWeight: "600",
    //     },
    //   },
    //   content: {
    //     borderRadius: "{border.radius.md}",
    //   },
    //   mask: {
    //     transitionDuration: "0.3s",
    //   },
    //   navigation: {
    //     list: {
    //       padding: "0.25rem 0.25rem",
    //       gap: "2px",
    //     },
    //     item: {
    //       padding: "0.5rem 0.75rem",
    //       borderRadius: "{border.radius.sm}",
    //       gap: "0.5rem",
    //     },
    //     submenuLabel: {
    //       padding: "0.5rem 0.75rem",
    //       fontWeight: "600",
    //     },
    //     submenuIcon: {
    //       size: "0.875rem",
    //     },
    //   },
    //   overlay: {
    //     select: {
    //       borderRadius: "{border.radius.md}",
    //       shadow:
    //         "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",
    //     },
    //     popover: {
    //       borderRadius: "{border.radius.md}",
    //       padding: "0.75rem",
    //       shadow:
    //         "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",
    //     },
    //     modal: {
    //       borderRadius: "{border.radius.xl}",
    //       padding: "1.25rem",
    //       shadow:
    //         "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
    //     },
    //     navigation: {
    //       shadow:
    //         "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",
    //     },
    //   },
    colorScheme: {
        light: {
            surface: {
                0: '#ffffff',
                50: '{uvGrey.50}',
                100: '{uvGrey.100}',
                200: '{uvGrey.200}',
                300: '{uvGrey.300}',
                400: '{uvGrey.400}',
                500: '{uvGrey.500}',
                600: '{uvGrey.600}',
                700: '{uvGrey.700}',
                800: '{uvGrey.800}',
                900: '{uvGrey.900}',
                950: '{uvGrey.950}',
            },
            primary: {
                color: '{primary.950}',
                contrastColor: '{surface.0}',
                hoverColor: '{primary.600}',
                activeColor: '{primary.950}',
            },
            highlight: {
                background: '{primary.50}',
                focusBackground: '{primary.100}',
                color: '{primary.700}',
                focusColor: '{primary.800}',
            },
            //   mask: {
            //     background: "rgba(0,0,0,0.4)",
            //     color: "{surface.200}",
            //   },
            formField: {
                //   background: "{surface.0}",
                disabledBackground: '{surface.50}',
                //   filledBackground: "{surface.50}",
                //   filledHoverBackground: "{surface.50}",
                //   filledFocusBackground: "{surface.50}",
                //   borderColor: "{surface.300}",
                hoverBorderColor: '{surface.950}',
                focusBorderColor: '{primary.950}',
                //   invalidBorderColor: "{red.400}",
                //   color: "{surface.700}",
                disabledColor: '{surface.300}',
                //   placeholderColor: "{surface.500}",
                //   invalidPlaceholderColor: "{red.600}",
                //   floatLabelColor: "{surface.500}",
                //   floatLabelFocusColor: "{primary.600}",
                //   floatLabelActiveColor: "{surface.500}",
                //   floatLabelInvalidColor: "{form.field.invalid.placeholder.color}",
                //   iconColor: "{surface.400}",
                //   shadow: "0 0 #0000, 0 0 #0000, 0 1px 2px 0 rgba(18, 18, 23, 0.05)",
            },
            //   text: {
            //     color: "{surface.700}",
            //     hoverColor: "{surface.800}",
            //     mutedColor: "{surface.500}",
            //     hoverMutedColor: "{surface.600}",
            //   },
            //   content: {
            //     background: "{surface.0}",
            //     hoverBackground: "{surface.100}",
            //     borderColor: "{surface.200}",
            //     color: "{text.color}",
            //     hoverColor: "{text.hover.color}",
            //   },
            //   overlay: {
            //     select: {
            //       background: "{surface.0}",
            //       borderColor: "{surface.200}",
            //       color: "{text.color}",
            //     },
            //     popover: {
            //       background: "{surface.0}",
            //       borderColor: "{surface.200}",
            //       color: "{text.color}",
            //     },
            //     modal: {
            //       background: "{surface.0}",
            //       borderColor: "{surface.200}",
            //       color: "{text.color}",
            //     },
            //   },
            //   list: {
            //     option: {
            //       focusBackground: "{surface.100}",
            //       selectedBackground: "{highlight.background}",
            //       selectedFocusBackground: "{highlight.focus.background}",
            //       color: "{text.color}",
            //       focusColor: "{text.hover.color}",
            //       selectedColor: "{highlight.color}",
            //       selectedFocusColor: "{highlight.focus.color}",
            //       icon: {
            //         color: "{surface.400}",
            //         focusColor: "{surface.500}",
            //       },
            //     },
            //     optionGroup: {
            //       background: "transparent",
            //       color: "{text.muted.color}",
            //     },
            //   },
            //   navigation: {
            //     item: {
            //       focusBackground: "{surface.100}",
            //       activeBackground: "{surface.100}",
            //       color: "{text.color}",
            //       focusColor: "{text.hover.color}",
            //       activeColor: "{text.hover.color}",
            //       icon: {
            //         color: "{surface.400}",
            //         focusColor: "{surface.500}",
            //         activeColor: "{surface.500}",
            //       },
            //     },
            //     submenuLabel: {
            //       background: "transparent",
            //       color: "{text.muted.color}",
            //     },
            //     submenuIcon: {
            //       color: "{surface.400}",
            //       focusColor: "{surface.500}",
            //       activeColor: "{surface.500}",
            //     },
            //   },
        },
        dark: {
            surface: {
                0: '#ffffff',
                50: '{uvGrey.50}',
                100: '{uvGrey.100}',
                200: '{uvGrey.200}',
                300: '{uvGrey.300}',
                400: '{uvGrey.400}',
                500: '{uvGrey.500}',
                600: '{uvGrey.600}',
                700: '{uvGrey.700}',
                800: '{uvGrey.800}',
                900: '{uvGrey.900}',
                950: '{uvGrey.950}',
            },
            primary: {
                color: '{primary.400}',
                contrastColor: '{surface.900}',
                hoverColor: '{primary.300}',
                activeColor: '{primary.200}',
            },
            highlight: {
                background:
                    'color-mix(in srgb, {primary.400}, transparent 84%)',
                focusBackground:
                    'color-mix(in srgb, {primary.400}, transparent 76%)',
                color: 'rgba(255,255,255,.87)',
                focusColor: 'rgba(255,255,255,.87)',
            },
            //   mask: {
            //     background: "rgba(0,0,0,0.6)",
            //     color: "{surface.200}",
            //   },
            //   formField: {
            //     background: "{surface.950}",
            //     disabledBackground: "{surface.700}",
            //     filledBackground: "{surface.800}",
            //     filledHoverBackground: "{surface.800}",
            //     filledFocusBackground: "{surface.800}",
            //     borderColor: "{surface.600}",
            //     hoverBorderColor: "{surface.500}",
            //     focusBorderColor: "{primary.color}",
            //     invalidBorderColor: "{red.300}",
            //     color: "{surface.0}",
            //     disabledColor: "{surface.400}",
            //     placeholderColor: "{surface.400}",
            //     invalidPlaceholderColor: "{red.400}",
            //     floatLabelColor: "{surface.400}",
            //     floatLabelFocusColor: "{primary.color}",
            //     floatLabelActiveColor: "{surface.400}",
            //     floatLabelInvalidColor: "{form.field.invalid.placeholder.color}",
            //     iconColor: "{surface.400}",
            //     shadow: "0 0 #0000, 0 0 #0000, 0 1px 2px 0 rgba(18, 18, 23, 0.05)",
            //   },
            //   text: {
            //     color: "{surface.0}",
            //     hoverColor: "{surface.0}",
            //     mutedColor: "{surface.400}",
            //     hoverMutedColor: "{surface.300}",
            //   },
            //   content: {
            //     background: "{surface.900}",
            //     hoverBackground: "{surface.800}",
            //     borderColor: "{surface.700}",
            //     color: "{text.color}",
            //     hoverColor: "{text.hover.color}",
            //   },
            //   overlay: {
            //     select: {
            //       background: "{surface.900}",
            //       borderColor: "{surface.700}",
            //       color: "{text.color}",
            //     },
            //     popover: {
            //       background: "{surface.900}",
            //       borderColor: "{surface.700}",
            //       color: "{text.color}",
            //     },
            //     modal: {
            //       background: "{surface.900}",
            //       borderColor: "{surface.700}",
            //       color: "{text.color}",
            //     },
            //   },
            //   list: {
            //     option: {
            //       focusBackground: "{surface.800}",
            //       selectedBackground: "{highlight.background}",
            //       selectedFocusBackground: "{highlight.focus.background}",
            //       color: "{text.color}",
            //       focusColor: "{text.hover.color}",
            //       selectedColor: "{highlight.color}",
            //       selectedFocusColor: "{highlight.focus.color}",
            //       icon: {
            //         color: "{surface.500}",
            //         focusColor: "{surface.400}",
            //       },
            //     },
            //     optionGroup: {
            //       background: "transparent",
            //       color: "{text.muted.color}",
            //     },
            //   },
            //   navigation: {
            //     item: {
            //       focusBackground: "{surface.800}",
            //       activeBackground: "{surface.800}",
            //       color: "{text.color}",
            //       focusColor: "{text.hover.color}",
            //       activeColor: "{text.hover.color}",
            //       icon: {
            //         color: "{surface.500}",
            //         focusColor: "{surface.400}",
            //         activeColor: "{surface.400}",
            //       },
            //     },
            //     submenuLabel: {
            //       background: "transparent",
            //       color: "{text.muted.color}",
            //     },
            //     submenuIcon: {
            //       color: "{surface.500}",
            //       focusColor: "{surface.400}",
            //       activeColor: "{surface.400}",
            //     },
            //   },
        },
    },
};

export default {
    primitive,
    semantic,
} satisfies AuraBaseDesignTokens;
