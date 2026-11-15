import React from 'react';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-parchment-300 bg-parchment-100 text-parchment-900 mt-20 font-serif">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-editorial-burgundy" />
              <span className="font-bold tracking-widest text-lg">CARTLY BOOKSTORE</span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              An independent editorial sanctuary for bibliophiles. We publish and distribute carefully curated literary works across fine formats.
            </p>
          </div>

          <div>
            <h4 className="text-xs uppercase tracking-widest font-sans font-bold text-gray-800 mb-4">Curated Genres</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link href="/?categoryId=cat_001" className="hover:text-editorial-burgundy">Literary Fiction</Link></li>
              <li><Link href="/?categoryId=cat_002" className="hover:text-editorial-burgundy">Speculative &amp; Sci-Fi</Link></li>
              <li><Link href="/?categoryId=cat_003" className="hover:text-editorial-burgundy">Philosophy &amp; Essays</Link></li>
              <li><Link href="/?categoryId=cat_004" className="hover:text-editorial-burgundy">Ancient Science &amp; Logic</Link></li>
              <li><Link href="/?categoryId=cat_005" className="hover:text-editorial-burgundy">Collected Poetry</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs uppercase tracking-widest font-sans font-bold text-gray-800 mb-4">Customer Services</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link href="/orders" className="hover:text-editorial-burgundy">Track Existing Order</Link></li>
              <li><Link href="/cart" className="hover:text-editorial-burgundy">Review Shopping Cart</Link></li>
              <li><span className="text-gray-400">Deterministic Sandbox Payments</span></li>
              <li><span className="text-gray-400">Verified Purchaser Invoicing</span></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs uppercase tracking-widest font-sans font-bold text-gray-800 mb-4">Editions &amp; Craft</h4>
            <p className="text-sm text-gray-600 leading-relaxed">
              Every book listed is bound to archival standards, with acid-free paper, Smyth-sewn signatures, and blind-stamped cloth bindings.
            </p>
            <div className="mt-4 text-xs font-sans text-gray-500">
              Part of the Cartly E-Commerce Collection
            </div>
          </div>
        </div>

        <div className="border-t border-parchment-200 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500 font-sans">
          <p>&copy; 2026 Cartly Online Bookstore. All rights reserved.</p>
          <p className="mt-2 md:mt-0">Independent Domain Application &bull; Phase 1</p>
        </div>
      </div>
    </footer>
  );
}
