import {
  NavbarTwoColumns,
  NavMenu,
  NavMenuItem,
  Section,
} from 'astro-boilerplate-components';

const Navbar = () => (
  <Section>
    <NavbarTwoColumns>
      <a className="text-xl font-bold text-fg1" href="/">
        Trent Cowden
      </a>
      <NavMenu>
        <NavMenuItem href="https://github.com/trentcowden">GitHub</NavMenuItem>
        <NavMenuItem href="https://www.linkedin.com/in/trentcowden/">
          LinkedIn
        </NavMenuItem>
        <NavMenuItem href="https://buymeacoffee.com/trentcowden">
          Buy Me a Coffee
        </NavMenuItem>
        <NavMenuItem href="mailto:trentcowdenapps@proton.me">
          Email Me
        </NavMenuItem>
      </NavMenu>
    </NavbarTwoColumns>
  </Section>
);

export { Navbar };
