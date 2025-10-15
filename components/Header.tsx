"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/art", label: "Art" },
  { href: "/music", label: "Music" },
  { href: "/graphics", label: "Graphics" },
  { href: "/poems", label: "Poems" },
  { href: "/photos", label: "Photos" }
] as const;

export default function Header() {
  const [navOpen, setNavOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    const body = document.body;
    const previous = body.style.overflow;
    body.style.overflow = navOpen ? "hidden" : "";
    return () => {
      body.style.overflow = previous;
    };
  }, [navOpen]);

  return (
    <header className="site-header">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">
          ✦
        </span>
        <h1>luke white</h1>
      </div>
      <nav className="primary-nav">
        <button
          type="button"
          className={`menu-toggle${navOpen ? " open" : ""}`}
          aria-expanded={navOpen}
          aria-controls="global-nav-links"
          aria-label="Toggle navigation"
          onClick={() => setNavOpen((value) => !value)}
        >
          <span />
          <span />
          <span />
        </button>
        <ul id="global-nav-links" className={navOpen ? "open" : undefined}>
          {navLinks.map((link) => {
            const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <li key={link.href}>
                <Link href={link.href} aria-current={isActive ? "page" : undefined}>
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
