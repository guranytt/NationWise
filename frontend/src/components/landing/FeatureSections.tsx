import { Link } from 'react-router';

function FeatureReport() {
  return (
    <div className="py-16 border-b border-rule">
      <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 max-w-6xl">
        <div className="pr-0 md:pr-12 border-r-0 md:border-r border-rule">
          <p className="text-sm font-sans uppercase text-ink mb-4">Registry Entry 01</p>
          <h2 className="text-3xl font-serif text-ink leading-snug mb-6">
            Public Issue Registration
          </h2>
          <p className="text-base font-serif text-ink leading-relaxed mb-8 max-w-prose">
            Submit local problems into the public record. Our reporting protocol captures the location, category, and precise description of the issue to ensure it is routed correctly without requiring a user account.
          </p>
          <Link to="/report" className="inline-flex items-center gap-2 text-ink font-sans font-medium hover:underline">
            File a report &rarr;
          </Link>
        </div>

        <div className="flex flex-col justify-center">
          <div className="border border-rule p-6 bg-paper">
            <p className="text-xs font-sans uppercase text-ink mb-4 border-b border-rule pb-2">Record Preview</p>
            <div className="space-y-4 font-sans text-sm text-ink">
              <div>
                <span className="font-semibold">Title:</span> Collapsed drainage on Aba Road
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><span className="font-semibold">Category:</span> Water & Sanitation</div>
                <div><span className="font-semibold">State:</span> Rivers State</div>
              </div>
              <div className="border-t border-rule pt-4 mt-2">
                <span className="font-semibold block mb-1">Description:</span>
                <span className="opacity-80 leading-relaxed">The drainage has collapsed causing flooding of residential areas after every rainfall...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureRoute() {
  return (
    <div className="py-16 border-b border-rule bg-paper">
      <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 max-w-6xl">
        <div className="order-2 md:order-1 flex flex-col justify-center pr-0 md:pr-12 border-r-0 md:border-r border-rule">
          <div className="border border-rule p-6 bg-paper">
            <p className="text-xs font-sans uppercase text-ink mb-4 border-b border-rule pb-2">Routing Protocol</p>
            <div className="space-y-3 font-sans text-sm text-ink">
              <div className="flex justify-between border-b border-rule pb-2">
                <span>Category</span> <span className="font-medium">Roads & Transport</span>
              </div>
              <div className="flex justify-between border-b border-rule pb-2">
                <span>State</span> <span className="font-medium">Kano State</span>
              </div>
              <div className="flex justify-between border-b border-rule pb-2">
                <span>LGA</span> <span className="font-medium">Kano Municipal</span>
              </div>
              <div className="pt-4 flex gap-4 items-start">
                <div className="font-bold text-verified uppercase tracking-wider text-xs">Assigned</div>
                <div>
                  <div className="font-bold">Kano State Public Works</div>
                  <div className="opacity-80 text-xs">Roads & Infrastructure Directorate</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="order-1 md:order-2 pl-0 md:pl-4">
          <p className="text-sm font-sans uppercase text-ink mb-4">Registry Entry 02</p>
          <h2 className="text-3xl font-serif text-ink leading-snug mb-6">
            Automated Agency Routing
          </h2>
          <p className="text-base font-serif text-ink leading-relaxed">
            The system maps every issue by category, state, and LGA directly to the responsible government agency. This bypasses manual referrals and creates an immediate point of accountability.
          </p>
        </div>
      </div>
    </div>
  );
}

function FeatureTrack() {
  return (
    <div className="py-16 border-b border-rule">
      <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 max-w-6xl">
        <div className="pr-0 md:pr-12 border-r-0 md:border-r border-rule">
          <p className="text-sm font-sans uppercase text-ink mb-4">Registry Entry 03</p>
          <h2 className="text-3xl font-serif text-ink leading-snug mb-6">
            Public Tracking & Audit
          </h2>
          <p className="text-base font-serif text-ink leading-relaxed mb-6">
            Status changes are logged permanently on the public record. This provides journalists, NGOs, and citizens with citable evidence of agency responsiveness and resolution times.
          </p>
        </div>

        <div className="flex flex-col justify-center">
           <div className="border border-rule p-6 bg-paper">
            <p className="text-xs font-sans uppercase text-ink mb-4 border-b border-rule pb-2">Status Log</p>
            <div className="space-y-4 font-sans text-sm">
              <div className="flex justify-between items-center pb-2 border-b border-rule">
                <span className="text-pending font-semibold">Submitted</span>
                <span className="text-ink opacity-60 text-xs">2 days ago</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-rule">
                <span className="text-verified font-semibold">Acknowledged</span>
                <span className="text-ink opacity-60 text-xs">1 day ago</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-rule">
                <span className="text-pending font-semibold">In Progress</span>
                <span className="text-ink opacity-60 text-xs">5 hours ago</span>
              </div>
               <div className="flex justify-between items-center">
                <span className="text-ink opacity-50 italic">Awaiting resolution...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FeatureSections() {
  return (
    <div className="bg-paper">
      <FeatureReport />
      <FeatureRoute />
      <FeatureTrack />
    </div>
  );
}
