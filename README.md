Directory structure:
└── sobhan-s-axon/
    ├── README.md
    ├── commitlint.config.js
    ├── docker-compose.dev.yml
    ├── docker-compose.yml
    ├── eslint.config.mjs
    ├── package.json
    ├── pnpm-workspace.yaml
    ├── turbo.json
    ├── .npmrc
    ├── .prettierignore
    ├── .prettierrc
    ├── .txt
    ├── apps/
    │   ├── assetService/
    │   │   ├── eslint.config.mjs
    │   │   ├── nodemon.json
    │   │   ├── package.json
    │   │   ├── tsconfig.json
    │   │   ├── tsconfig.tsbuildinfo
    │   │   └── src/
    │   │       ├── app.ts
    │   │       ├── index.ts
    │   │       ├── controller/
    │   │       │   ├── asset.controller.ts
    │   │       │   └── assetVariants.controller.ts
    │   │       ├── routes/
    │   │       │   ├── asset.routes.ts
    │   │       │   └── assetVariant.routes.ts
    │   │       └── service/
    │   │           ├── asset.service.ts
    │   │           ├── assetVariant.service.ts
    │   │           └── VariantQueue.service.ts
    │   ├── authService/
    │   │   ├── eslint.config.mjs
    │   │   ├── nodemon.json
    │   │   ├── package.json
    │   │   ├── tsconfig.json
    │   │   ├── tsconfig.tsbuildinfo
    │   │   └── src/
    │   │       ├── app.ts
    │   │       ├── index.ts
    │   │       ├── swagger.ts
    │   │       ├── swagger_output.json
    │   │       ├── controller/
    │   │       │   ├── auth.controller.ts
    │   │       │   └── user.controller.ts
    │   │       ├── repository/
    │   │       │   ├── auth.repository.ts
    │   │       │   └── user.repository.ts
    │   │       ├── routes/
    │   │       │   ├── auth.routes.ts
    │   │       │   └── user.routes.ts
    │   │       └── services/
    │   │           ├── auth.service.ts
    │   │           ├── token.service.ts
    │   │           └── user.service.ts
    │   ├── gatewayApi/
    │   │   ├── nodemon.json
    │   │   ├── package.json
    │   │   ├── tsconfig.json
    │   │   ├── tsconfig.tsbuildinfo
    │   │   └── src/
    │   │       └── index.ts
    │   ├── projectService/
    │   │   ├── eslint.config.mjs
    │   │   ├── nodemon.json
    │   │   ├── package.json
    │   │   ├── tsconfig.json
    │   │   └── src/
    │   │       ├── app.ts
    │   │       ├── index.ts
    │   │       ├── controller/
    │   │       │   ├── organization.controller.ts
    │   │       │   └── project.controller.ts
    │   │       ├── repository/
    │   │       │   ├── organization.repository.ts
    │   │       │   └── project.repository.ts
    │   │       ├── routes/
    │   │       │   ├── organization.routes.ts
    │   │       │   └── project.routes.ts
    │   │       └── services/
    │   │           ├── organization.service.ts
    │   │           └── project.service.ts
    │   ├── taskService/
    │   │   ├── eslint.config.mjs
    │   │   ├── nodemon.json
    │   │   ├── package.json
    │   │   ├── tsconfig.json
    │   │   ├── tsconfig.tsbuildinfo
    │   │   └── src/
    │   │       ├── app.ts
    │   │       ├── index.ts
    │   │       ├── controller/
    │   │       │   └── task.controller.ts
    │   │       ├── interfaces/
    │   │       │   └── task.interface.ts
    │   │       ├── routes/
    │   │       │   ├── asset.routes.ts
    │   │       │   └── task.routes.ts
    │   │       └── services/
    │   │           └── task.service.ts
    │   ├── uploadService/
    │   │   ├── eslint.config.mjs
    │   │   ├── nodemon.json
    │   │   ├── package.json
    │   │   ├── tsconfig.json
    │   │   ├── tsconfig.tsbuildinfo
    │   │   └── src/
    │   │       ├── app.ts
    │   │       ├── index.ts
    │   │       ├── routes/
    │   │       │   └── upload.routes.ts
    │   │       └── service/
    │   │           ├── taskHelper.service.ts
    │   │           └── upload.service.ts
    │   ├── web/
    │   │   ├── README.md
    │   │   ├── components.json
    │   │   ├── eslint.config.js
    │   │   ├── index.html
    │   │   ├── package.json
    │   │   ├── postcss.config.js
    │   │   ├── tailwind.config.js
    │   │   ├── tsconfig.app.json
    │   │   ├── tsconfig.json
    │   │   ├── tsconfig.node.json
    │   │   ├── vite.config.ts
    │   │   ├── public/
    │   │   │   └── placeholder.webp
    │   │   └── src/
    │   │       ├── App.css
    │   │       ├── App.tsx
    │   │       ├── index.css
    │   │       ├── main.tsx
    │   │       ├── components/
    │   │       │   ├── app-sidebar.tsx
    │   │       │   ├── badge.tsx
    │   │       │   ├── chart-area-interactive.tsx
    │   │       │   ├── data-table.tsx
    │   │       │   ├── form-alert.tsx
    │   │       │   ├── login-form.tsx
    │   │       │   ├── nav-documents.tsx
    │   │       │   ├── nav-main.tsx
    │   │       │   ├── nav-secondary.tsx
    │   │       │   ├── nav-user.tsx
    │   │       │   ├── section-cards.tsx
    │   │       │   ├── Signup-form.tsx
    │   │       │   ├── site-header.tsx
    │   │       │   ├── UploadSection.tsx
    │   │       │   └── ui/
    │   │       │       ├── alert-dialog.tsx
    │   │       │       ├── alert.tsx
    │   │       │       ├── avatar.tsx
    │   │       │       ├── badge.tsx
    │   │       │       ├── breadcrumb.tsx
    │   │       │       ├── button.tsx
    │   │       │       ├── card.tsx
    │   │       │       ├── chart.tsx
    │   │       │       ├── checkbox.tsx
    │   │       │       ├── dialog.tsx
    │   │       │       ├── drawer.tsx
    │   │       │       ├── dropdown-menu.tsx
    │   │       │       ├── field.tsx
    │   │       │       ├── input.tsx
    │   │       │       ├── label.tsx
    │   │       │       ├── progress.tsx
    │   │       │       ├── select.tsx
    │   │       │       ├── separator.tsx
    │   │       │       ├── sheet.tsx
    │   │       │       ├── sidebar.tsx
    │   │       │       ├── skeleton.tsx
    │   │       │       ├── sonner.tsx
    │   │       │       ├── switch.tsx
    │   │       │       ├── table.tsx
    │   │       │       ├── tabs.tsx
    │   │       │       ├── textarea.tsx
    │   │       │       ├── toggle-group.tsx
    │   │       │       ├── toggle.tsx
    │   │       │       └── tooltip.tsx
    │   │       ├── config/
    │   │       │   └── axios.ts
    │   │       ├── constants/
    │   │       │   ├── chunkSize.ts
    │   │       │   ├── docsType.ts
    │   │       │   ├── statusType.ts
    │   │       │   └── userManagementRole.ts
    │   │       ├── helper/
    │   │       │   ├── error.tsx
    │   │       │   ├── fileHandling.helper.ts
    │   │       │   ├── formatByte.ts
    │   │       │   └── getInitials.tsx
    │   │       ├── hooks/
    │   │       │   ├── use-mobile.tsx
    │   │       │   └── useUpload.ts
    │   │       ├── interfaces/
    │   │       │   ├── FInalizedAsset.ts
    │   │       │   ├── projectBoard.ts
    │   │       │   ├── Task.interface.ts
    │   │       │   ├── TaskDetails.interfaces.ts
    │   │       │   ├── upload.interface.ts
    │   │       │   └── uploadSection.interface.ts
    │   │       ├── json/
    │   │       │   └── data.json
    │   │       ├── lib/
    │   │       │   ├── api-endpints.ts
    │   │       │   ├── roteGuard.tsx
    │   │       │   └── utils.ts
    │   │       ├── pages/
    │   │       │   ├── Accounts.tsx
    │   │       │   ├── Dashboard.tsx
    │   │       │   ├── SuperAdminPage.tsx
    │   │       │   ├── TaskDetails.tsx
    │   │       │   ├── Usermanagementpage.tsx
    │   │       │   ├── auth/
    │   │       │   │   ├── ForgotPassword.tsx
    │   │       │   │   ├── Login.tsx
    │   │       │   │   ├── ResetPassword.tsx
    │   │       │   │   ├── Signup.tsx
    │   │       │   │   └── verifyEmail.tsx
    │   │       │   └── projects/
    │   │       │       ├── Finalizedassetspage.tsx
    │   │       │       ├── MytaskPage.tsx
    │   │       │       ├── Project.layout.tsx
    │   │       │       ├── ProjectBoard.tsx
    │   │       │       ├── ProjectMember.tsx
    │   │       │       ├── Projectpage.tsx
    │   │       │       ├── ProjectReport.tsx
    │   │       │       ├── ProjectReviewPage.tsx
    │   │       │       └── ProjectUpload.tsx
    │   │       ├── services/
    │   │       │   ├── AdminUser.service.ts
    │   │       │   ├── Project.service.ts
    │   │       │   ├── SuperAdmin.service.ts
    │   │       │   ├── task.service.ts
    │   │       │   └── user.service.ts
    │   │       ├── store/
    │   │       │   └── auth.store.ts
    │   │       └── validations/
    │   │           ├── createTask.validations.ts
    │   │           └── userManagement.validations.ts
    │   └── worker/
    │       ├── eslint.config.mjs
    │       ├── nodemon.json
    │       ├── package.json
    │       ├── tsconfig.json
    │       ├── tsconfig.tsbuildinfo
    │       └── src/
    │           ├── asset.processor.ts
    │           ├── index.ts
    │           └── processior/
    │               ├── image.processor.ts
    │               └── video.processor.ts
    ├── Docker/
    │   ├── authservice.Dockerfile
    │   ├── gateway.Dockerfile
    │   ├── projectservice.Dockerfile
    │   └── web.Dockerfile
    ├── infra/
    │   └── nginx/
    │       └── default.conf
    ├── packages/
    │   ├── common/
    │   │   ├── package.json
    │   │   ├── tsconfig.json
    │   │   └── src/
    │   │       ├── index.ts
    │   │       ├── repository/
    │   │       │   └── auth.repository.ts
    │   │       └── services/
    │   │           ├── activity.service.ts
    │   │           ├── permission.service.ts
    │   │           └── token.service.ts
    │   ├── config/
    │   │   ├── eslint.config.mjs
    │   │   ├── package.json
    │   │   ├── tsconfig.json
    │   │   └── src/
    │   │       ├── env.config.ts
    │   │       ├── index.ts
    │   │       ├── logger.config.ts
    │   │       ├── mail.config.ts
    │   │       ├── minio.config.ts
    │   │       ├── rabbitmq.config.ts
    │   │       └── tus.config.ts
    │   ├── constants/
    │   │   ├── eslint.config.mjs
    │   │   ├── package.json
    │   │   ├── tsconfig.json
    │   │   └── src/
    │   │       └── index.ts
    │   ├── eslint-config/
    │   │   ├── README.md
    │   │   ├── base.js
    │   │   ├── next.js
    │   │   ├── package.json
    │   │   └── react-internal.js
    │   ├── mail/
    │   │   ├── package.json
    │   │   ├── tsconfig.json
    │   │   └── src/
    │   │       ├── index.ts
    │   │       └── templates/
    │   │           ├── reset.template.ts
    │   │           └── verification.template.ts
    │   ├── middlewares/
    │   │   ├── package.json
    │   │   ├── tsconfig.json
    │   │   └── src/
    │   │       ├── auth.middleware.ts
    │   │       ├── error.middleware.ts
    │   │       ├── index.ts
    │   │       ├── ratelimitor.middleware.ts
    │   │       ├── rbac.middleware.ts
    │   │       └── validation.middleware.ts
    │   ├── mongodb/
    │   │   ├── package.json
    │   │   ├── tsconfig.json
    │   │   └── src/
    │   │       ├── connection.ts
    │   │       ├── index.ts
    │   │       ├── interfaces/
    │   │       │   └── index.interface.ts
    │   │       └── models/
    │   │           ├── asset.models.ts
    │   │           ├── assetVariants.models.ts
    │   │           ├── comments.model.ts
    │   │           ├── notifications.models.ts
    │   │           └── tags.models.ts
    │   ├── postgresql_db/
    │   │   ├── index.ts
    │   │   ├── package.json
    │   │   ├── prisma.config.ts
    │   │   ├── seed.ts
    │   │   ├── tsconfig.json
    │   │   └── prisma/
    │   │       ├── schema.prisma
    │   │       └── migrations/
    │   │           ├── migration_lock.toml
    │   │           ├── 20260215061437_user_schema/
    │   │           │   └── migration.sql
    │   │           ├── 20260215114552_added_user_alltokenverification_organization_project_module_tasks_members_timelog_activitylog_all_role_permission_enums/
    │   │           │   └── migration.sql
    │   │           ├── 20260224065428_add_org_status/
    │   │           │   └── migration.sql
    │   │           ├── 20260224101055_added_relations_ship_betwen_orgs_and_project_memebers/
    │   │           │   └── migration.sql
    │   │           ├── 20260224101527_add_optional_for_project_id_for_project_team_member/
    │   │           │   └── migration.sql
    │   │           ├── 20260224102952_add_one_one_member_have_multiple_projects/
    │   │           │   └── migration.sql
    │   │           ├── 20260225091433_remove_the_cascade_proerty_from_activitylogs/
    │   │           │   └── migration.sql
    │   │           ├── 20260226064212_update_project_id_user_id_as_uniqueness/
    │   │           │   └── migration.sql
    │   │           ├── 20260226082317_remove_module/
    │   │           │   └── migration.sql
    │   │           ├── 20260226090654_add_optioal_for_project/
    │   │           │   └── migration.sql
    │   │           ├── 20260301120328_added_stat_and_end_time_timelog/
    │   │           │   └── migration.sql
    │   │           ├── 20260303062547_add_project_id_in_approval_model/
    │   │           │   └── migration.sql
    │   │           └── 20260305105931_add_orgnanization_requst_access/
    │   │               └── migration.sql
    │   ├── repository/
    │   │   ├── package.json
    │   │   ├── tsconfig.json
    │   │   ├── tsconfig.tsbuildinfo
    │   │   └── src/
    │   │       ├── index.ts
    │   │       ├── approvalrepository/
    │   │       │   └── approval.repository.ts
    │   │       ├── assetrepository/
    │   │       │   └── asset.repository.ts
    │   │       ├── assetVariants/
    │   │       │   └── assetVariants.repository.ts
    │   │       ├── interfaces/
    │   │       │   └── task.interface.ts
    │   │       ├── taskrepository/
    │   │       │   └── task.repository.ts
    │   │       └── timelogRepo/
    │   │           └── timelog.repository.ts
    │   ├── typescript-config/
    │   │   ├── base.json
    │   │   ├── nextjs.json
    │   │   ├── package.json
    │   │   └── react-library.json
    │   ├── utils/
    │   │   ├── package.json
    │   │   ├── tsconfig.json
    │   │   └── src/
    │   │       ├── apiError.utils.ts
    │   │       ├── apiResponce.utils.ts
    │   │       ├── asyncHandler.utils.ts
    │   │       └── index.ts
    │   └── validations/
    │       ├── package.json
    │       ├── tsconfig.json
    │       └── src/
    │           ├── index.ts
    │           ├── auth/
    │           │   └── auth.validations.ts
    │           ├── orgs/
    │           │   └── orgs.validations.ts
    │           ├── project/
    │           │   └── project.validation.ts
    │           ├── tasks/
    │           │   └── task.validatiaon.ts
    │           └── user/
    │               └── user.validations.ts
    └── .husky/
        ├── commit-msg
        └── pre-commit
