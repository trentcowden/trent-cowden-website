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
        {/* <NavMenuItem href="/posts/">Blogs</NavMenuItem> */}
        <NavMenuItem href="https://github.com/trentcowden">GitHub</NavMenuItem>
        <NavMenuItem href="https://www.linkedin.com/in/trentcowden/">
          LinkedIn
        </NavMenuItem>
      </NavMenu>
    </NavbarTwoColumns>
  </Section>
);

export { Navbar };
